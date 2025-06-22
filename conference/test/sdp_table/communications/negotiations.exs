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
      assert_receive {:private_message, %{protocol: :ice_update, hash: "hash1", ice: "ice1b"}}, 2000

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

      assert_receive {:peer2_received, {:private_message, %{protocol: :ice_update, hash: "hash1", ice: "ice1"}}}, 1000
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
      assert_receive {:peer2_received, {:private_message, %{protocol: :ice_update, hash: "hash1", ice: "ice2"}}}, 1000
      Peers.update_ice(Peers, "hash2", "ice3")
      assert_receive {:peer3_received, {:private_message, %{protocol: :ice_update, hash: "hash2", ice: "ice3"}}}, 1000
      Peers.update_ice(Peers, "hash3", "ice4")
      assert_receive {:peer1_received, {:private_message, %{protocol: :ice_update, hash: "hash3", ice: "ice4"}}}, 1000
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

    test "scenario 7: user request video camera of one user" do
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
      assert %{"hash1" => %{connection_type: "data",creator_pid: pid1}} = Peers.join_negotiation(Peers, "hash3", "sdp3", peer2, "data")
      assert %{"hash2" => %{ connection_type: "video",
        partner_pid: ^peer2,
        sdp: "sdp2",
        creator_pid: ^pid1,
        ice: []
      }
      } = Peers.request_media_specific(Peers, pid1, "video", peer2)
      assert %{pending: %{"hash3" => _}, active: %{"hash1" => _, "hash2" => _} } = :sys.get_state(Peers)
    end
    test "scenario 8: user request and is not available" do
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
      Peers.join_negotiation(Peers, "hash1", "sdp1", peer1, "data")
      Peers.join_negotiation(Peers, "hash3", "sdp3", peer2, "data")
      assert nil == Peers.request_media_specific(Peers, peer1, "video", peer2)
      assert %{pending: %{"hash3" => _}, active: %{"hash1" => _} } = :sys.get_state(Peers)
    end

    test "scenario 9: same user enters again with video, should not consume the data type" do
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
      assert %{} == Peers.join_negotiation(Peers, "hash1", "sdp1", peer2, "data", false, "peer2")
      assert %{"hash1" => _s} = Peers.join_negotiation(Peers, "hash2", "sdp2", peer1, "data", false, "peer1")
      assert %{} == Peers.join_negotiation(Peers, "hash4", "sdp", peer2, "data", true, "peer2", ["peer1"])
      assert %{} == Peers.join_negotiation(Peers, "hash5", "sdp", peer1, "video")
      assert %{"hash2" => _s, "hash4" => _x} = Peers.join_negotiation(Peers, "hash6", "sdp", peer3, "data")
    end
    test "scenario 10: a third peer only matches with pending peers, not active ones" do
      peer1 = spawn(fn -> :ok end)
      assert %{} == Peers.join_negotiation(Peers, "hash1", "sdp1", peer1, "data", false, "user1")
      assert %{active: %{}, pending: %{"hash1" => %{name: "user1"}}} = :sys.get_state(Peers)
      peer2 = spawn(fn -> :ok end)
      matches_for_peer2 = Peers.join_negotiation(Peers, "hash2", "sdp2", peer2, "data", false, "user2")
      assert %{"hash1" => %{creator_pid: ^peer1}} = matches_for_peer2
      assert %{
        active: %{"hash1" => %{name: "user1", partner_pid: ^peer2}},
        pending: %{"hash2" => %{name: "user2"}}
      } = :sys.get_state(Peers)
      peer3 = spawn(fn -> :ok end)
      matches_for_peer3 = Peers.join_negotiation(Peers, "hash3", "sdp3", peer3, "data", false, "user3")
      assert %{"hash2" => %{creator_pid: ^peer2}} = matches_for_peer3
      refute Map.has_key?(matches_for_peer3, "hash1")
      assert %{
        active: %{
          "hash1" => %{name: "user1"},
          "hash2" => %{name: "user2", partner_pid: ^peer3}
        },
        pending: %{
          "hash3" => %{name: "user3"}
        }
      } = :sys.get_state(Peers)
    end
    test "scenario 11: three peers getting together, if correct payload they should all eventually match" do
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
      assert %{} == Peers.join_negotiation(Peers, "hash1", "sdp1", peer1, "data", false, "peer1")
      assert %{"hash1" => _s} = Peers.join_negotiation(Peers, "hash2", "sdp2", peer2, "data", false, "peer2")
      #hash1 p1 <-> p2
      #broadcast expected for user1 to join again
      assert %{"hash2" => _s} = Peers.join_negotiation(Peers, "hash3", "sdp", peer3, "data", false, "peer3")
      #hash2 p2 <-> p3
      #Expected that a broadcast is sent and users #2 to join again
      assert %{"hash3" => _s} = Peers.join_negotiation(Peers, "hash4", "sdp", peer1, "data", true, "peer1", ["peer2"])
      #hash3 p3 <-> p1
      # expected broadcast for user #3
      assert %{} == Peers.join_negotiation(Peers, "hash5", "sdp", peer3, "data", true, "peer3", ["peer2", "peer1"])
      assert %{
        active: %{
          "hash1" => %{name: "peer1", partner_pid: ^peer2, creator_pid: ^peer1},
          "hash2" => %{name: "peer2", partner_pid: ^peer3, creator_pid: ^peer2},
          "hash3" => %{name: "peer3", partner_pid: ^peer1, creator_pid: ^peer3},
        },
        pending: %{
          "hash4" => %{name: "peer1"},
          "hash5" => %{name: "peer3"},
        }
      } = :sys.get_state(Peers)
    end
    @tag :pending
    test "scenario 12: four peers getting together, if correct payload they should all eventually match" do
      test_pid = self()
      peer1 = spawn(fn x -> x end)
      peer2 = spawn(fn x -> x end)
      peer3 = spawn(fn x -> x end)
      peer4 = spawn(fn x -> x end)
      assert %{} == Peers.join_negotiation(Peers, "hash1", "sdp1", peer1, "data", false, "peer1")
      assert %{"hash1" => _s} = Peers.join_negotiation(Peers, "hash2", "sdp2", peer2, "data", false, "peer2")
      #hash1 p1 <-> p2
      assert %{} == Peers.join_negotiation(Peers, "hash3", "sdp", peer1, "data", true, "peer1", ["peer2"])
      assert %{"hash2" => _s, "hash3" => _x} = Peers.join_negotiation(Peers, "hash4", "sdp", peer3, "data", false, "peer3")
      #hash2 p2 <-> p3
      #hash3 p1 <-> p3
      assert %{"hash4" => _s} = Peers.join_negotiation(Peers, "hash5", "sdp", peer4, "data", false, "peer4")
      #hash4 p3 <-> p4
      assert %{} == Peers.join_negotiation(Peers, "hash6", "sdp", peer3, "data", true, "peer3", ["peer2", "peer1", "peer4"])
      assert %{"hash5" => _} = Peers.join_negotiation(Peers, "hash7", "sdp", peer2, "data", true, "peer2", ["peer3", "peer1"])
      #hash5 p2 <-> p4
      assert %{} == Peers.join_negotiation(Peers, "hash8", "sdp", peer1, "data", true, "peer1", ["peer2", "peer3"])
      assert %{"hash8" => _} = Peers.join_negotiation(Peers, "hash9", "sdp", peer4, "data", true, "peer4", ["peer3", "peer2"])
      #hash8 p4 <-> p1
      assert %{
        active: %{
          "hash1" => %{name: "peer1", partner_pid: ^peer2, creator_pid: ^peer1},
          "hash2" => %{name: "peer2", partner_pid: ^peer3, creator_pid: ^peer2},
          "hash3" => %{name: "peer1", partner_pid: ^peer3, creator_pid: ^peer1},
          "hash4" => %{name: "peer3", partner_pid: ^peer4, creator_pid: ^peer3},
          "hash5" => %{name: "peer4", partner_pid: ^peer2, creator_pid: ^peer4},
          "hash8" => %{name: "peer1", partner_pid: ^peer4, creator_pid: ^peer1},
        },
        pending: %{
          "hash6" => %{name: "peer3"},
          "hash7" => %{name: "peer2"},
        }
      } = :sys.get_state(Peers)
    end
  end


end
