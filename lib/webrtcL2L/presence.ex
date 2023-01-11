defmodule WebrtcL2L.Presence do
  use Phoenix.Presence, otp_app: :webrtcL2L, pubsub_server: WebrtcL2L.PubSub
end
