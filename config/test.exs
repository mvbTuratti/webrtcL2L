import Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :webrtcL2L, WebrtcL2LWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "XjKGivZIp+FvD5Qr0d0B56kMerm5sDrNp96dIqsxyyNpy8WLQg2ZZTEa3IrCUlyv",
  server: false

# In test we don't send emails.
config :webrtcL2L, WebrtcL2L.Mailer,
  adapter: Swoosh.Adapters.Test

# Print only warnings and errors during test
config :logger, level: :warn

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime
