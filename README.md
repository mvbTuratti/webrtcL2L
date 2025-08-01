# Conference

To start the project you need installed Eralng/OTP 26 and Elixir 1.16.1

You will also need to build the frontend prior to running, this requires Node v22.0.0 and npm 10.5.1


Once both are inslled, run `mix setup` in the folder `conference/` to install dependencies. Since this app requires browser permissions, it needs to run in 'https' instead of regular http. To do so locally, in conference folder you need to run:
`mix phx.gen.cert` hit Y for every eventual prompt. This will generate two self-signed certificates that we can use locally.

There are two stages to run the server locally.
  * Build the frontend
  * Run the backend


How does this work? 
The backend expects to send a SPA React page via the backend whenever a user hits the / endpoint. Afterwwards the react routing takes over and create dummy /<something>

To build the frontend, you need to be in `frontend/conference/` and run
  * create a folder called `/conference/assets/test/`
  * `npm run build` This command does the following: `vite build && mv dist/assets/* ../../conference/assets/test/ && mv dist/index.html ../../conference/lib/conference_web/controllers/page_html/index.html.heex && cp -r ../../conference/assets/test/ ../../conference/priv/static/assets/`, It builds and mv folders around, all it does is that it builds the page (html, css and js files) and tries to move to a place that the backend can use.
  

To start your Phoenix server:

  * Run `mix setup` to install and setup dependencies
  * Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html).

## Learn more

  * Official website: https://www.phoenixframework.org/
  * Guides: https://hexdocs.pm/phoenix/overview.html
  * Docs: https://hexdocs.pm/phoenix
  * Forum: https://elixirforum.com/c/phoenix-forum
  * Source: https://github.com/phoenixframework/phoenix


## Deploying in Fly.io


Install Fly CLI:
`> brew install flyctl`

Create your VM there and run:

`> fly auth login`

This will prompt a login in the browser, confirm it.

`> fly launch`