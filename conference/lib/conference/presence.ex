defmodule Conference.Presence do
  use Phoenix.Presence, otp_app: :conference, pubsub_server: Conference.PubSub
end
