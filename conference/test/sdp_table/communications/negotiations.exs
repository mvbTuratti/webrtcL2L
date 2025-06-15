defmodule SdpTable.Communications.Negotiations do
  use ConferenceWeb.ConnCase, async: false
  alias Conference.SdpTable.Peers
  describe "Able to create and find rooms" do
    setup do
      {:ok, _pid} = Peers.start_link(name: Peers)
      :ok
    end

    test "scenario 1: one peer enters, then a second enters and ICE updates cross-deliver" do
      test_pid = self()
      user1 = spawn(fn ->
        receive do
          msg -> IO.inspect(msg)
        end
      end)
      join = Peers.join_negotiation(Peers, "hash1", "sdp1", user1, "data")
      assert join == %{}
      assert  %{active: %{}, pending: %{"hash1" => %{
          connection_type: "data",
          partner_pid: nil,
          sdp: "sdp1",
          creator_pid: pid1,
          ice: [] }
        }} = :sys.get_state(Peers)
      assert :ok = Peers.update_ice(Peers, "hash1", "ice1a")
      assert %{active: %{}, pending: %{"hash1" => %{
        connection_type: "data",
        partner_pid: nil,
        sdp: "sdp1",
        creator_pid: ^pid1,
        ice: ["ice1a"] }
      }}  = :sys.get_state(Peers)
      assert :ok = Peers.update_ice(Peers, "hash1", "ice2a")
      assert %{active: %{}, pending: %{"hash1" => %{
        connection_type: "data",
        partner_pid: nil,
        sdp: "sdp1",
        creator_pid: ^pid1,
        ice: ["ice2a", "ice1a"] }
      }}  = :sys.get_state(Peers)
      peer2 =
        spawn(fn ->
          receive do
            msg -> send(test_pid, msg)
          end
        end)

      match =
        Peers.join_negotiation(Peers, "hash2", "sdp2", peer2, "data")
      assert %{
        "hash1" => %{
          connection_type: "data",
          partner_pid: ^peer2,
          sdp: "sdp1",
          creator_pid: ^pid1,
          ice: ["ice2a", "ice1a"]
        }
      } = match
      assert %{active: %{"hash1" => _som}, pending: %{"hash2" => _s} } = :sys.get_state(Peers)
      assert :ok == Peers.update_ice(Peers, "hash2", "ice2")
      assert %{pending: %{"hash2" => %{ice: ["ice2"]}}} = :sys.get_state(Peers)

      assert :ok == Peers.update_ice(Peers, "hash1", "ice1b")
      assert_receive {:ice_update, "hash1", "ice1b"}, 2000

    end

    test "scenario 2: both peers join and exchange direct ICE updates" do
      test_pid = self()

      peer1 =
        spawn(fn ->
          receive do
            msg -> send(test_pid, {:peer1_received, msg})
          end
        end)

      peer2 =
        spawn(fn ->
          receive do
            msg -> send(test_pid, {:peer2_received, msg})
          end
        end)

      assert Peers.join_negotiation(Peers, "hash1", "sdp1", peer1, "data") == %{}

      match =
        Peers.join_negotiation(Peers, "hash2", "sdp2", peer2, "data")
      assert %{"hash1" => %{partner_pid: ^peer2, creator_pid: ^peer1}} = match

      assert :ok == Peers.update_ice(Peers, "hash1", "ice1")
      assert :ok == Peers.update_ice(Peers, "hash2", "ice2")

      assert_receive {:peer2_received, {:ice_update, "hash1", "ice1"}}, 1000
    end

    test "scenario 3: deletion of a matched entry causes subsequent updates to fail" do
      test_pid = self()

      peer1 =
        spawn(fn ->
          receive do
            msg -> send(test_pid, {:peer1_received, msg})
          end
        end)

      peer2 =
        spawn(fn ->
          receive do
            msg -> send(test_pid, {:peer2_received, msg})
          end
        end)

      assert %{} = Peers.join_negotiation(Peers, "hash1", "sdp1", peer1, "data")
      Peers.join_negotiation(Peers, "hash2", "sdp2", peer2, "data")

      assert :ok == Peers.delete_entry(Peers, "hash1")
      result = Peers.update_ice(Peers, "hash1", "ice_after_delete")
      assert result == {:error, :not_found}
    end

    test "scenario 4: three member in complete path scenario" do
      test_pid = self()

      peer1 =
        spawn(fn ->
          receive do
            msg -> send(test_pid, {:peer1_received, msg})
          end
        end)

      peer2 =
        spawn(fn ->
          receive do
            msg -> send(test_pid, {:peer2_received, msg})
          end
        end)
      peer3 =
        spawn(fn ->
          receive do
            msg -> send(test_pid, {:peer3_received, msg})
          end
        end)

      assert %{} = Peers.join_negotiation(Peers, "hash1", "sdp1", peer1, "data")
      Peers.update_ice(Peers, "hash1", "ice1")
      assert %{"hash1" => %{ice: ["ice1"]}} = Peers.join_negotiation(Peers, "hash2", "sdp2", peer2, "data")
      match = Peers.join_negotiation(Peers, "hash3", "sdp3", peer3, "data")
      assert %{"hash2" => _s} = match
      assert %{"hash3" => _s} = Peers.join_negotiation(Peers, "hash4", "sdp", peer1, "data")
      Peers.update_ice(Peers, "hash1", "ice2")
      assert_receive {:peer2_received, {:ice_update, "hash1", "ice2"}}, 1000
      Peers.update_ice(Peers, "hash2", "ice3")
      assert_receive {:peer3_received, {:ice_update, "hash2", "ice3"}}, 1000
      Peers.update_ice(Peers, "hash3", "ice4")
      assert_receive {:peer1_received, {:ice_update, "hash3", "ice4"}}, 1000
    end

    test "scenario 5: same user joining twice does not receives updates about himself" do
      test_pid = self()

      peer1 =
        spawn(fn ->
          receive do
            msg -> send(test_pid, {:peer1_received, msg})
          end
        end)

      assert %{} = Peers.join_negotiation(Peers, "hash1", "sdp1", peer1, "data")
      assert %{} = Peers.join_negotiation(Peers, "hash2", "sdp2", peer1, "video")

      assert %{pending: %{"hash1" => _, "hash2" => _} } = :sys.get_state(Peers)
    end

    @tag :pending
    test "scenario 6: new user joining only receives data channel info" do
      test_pid = self()

      peer1 =
        spawn(fn ->
          receive do
            msg -> send(test_pid, {:peer1_received, msg})
          end
        end)
      peer2 =
        spawn(fn ->
          receive do
            msg -> send(test_pid, {:peer2_received, msg})
          end
        end)

      assert %{} = Peers.join_negotiation(Peers, "hash1", "sdp1", peer1, "data")
      assert %{} = Peers.join_negotiation(Peers, "hash2", "sdp2", peer1, "video")
      assert %{"hash1" => _} = Peers.join_negotiation(Peers, "hash3", "sdp3", peer2, "data")
      assert %{pending: %{"hash2" => _, "hash3" => _}, active: %{"hash1" => _} } = :sys.get_state(Peers)
    end
  end


end
