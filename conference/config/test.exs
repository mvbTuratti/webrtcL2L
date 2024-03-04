import Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :conference, ConferenceWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "Qt9U3ZWSh09pFIgRjasKx4Jsbn05J33n9LSP+m4/xRdgcoSmzYfoMWfsXnlNzDk0",
  server: false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime
