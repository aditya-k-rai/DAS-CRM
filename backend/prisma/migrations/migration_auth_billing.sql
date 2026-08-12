Error: 
0 `--to-...` parameter(s) provided. 1 must be provided.

Usage

  $ prisma migrate diff [options]

Options

  -h, --help               Display this help message
  --config                 Custom path to your Prisma config file
  -o, --output             Writes to a file instead of stdout

From and To inputs (1 `--from-...` and 1 `--to-...` must be provided):
  --from-url               A datasource URL
  --to-url

  --from-empty             Flag to assume from or to is an empty datamodel
  --to-empty

  --from-schema-datamodel  Path to a Prisma schema file, uses the datamodel for the diff
  --to-schema-datamodel

  --from-schema-datasource Path to a Prisma schema file, uses the datasource url for the diff
  --to-schema-datasource

  --from-migrations        Path to the Prisma Migrate migrations directory
  --to-migrations

  --from-local-d1          Automatically locate the local Cloudflare D1 database
  --to-local-d1

Shadow database (only required if using --from-migrations or --to-migrations):
  --shadow-database-url    URL for the shadow database

Flags

  --script                 Render a SQL script to stdout instead of the default human readable summary (not supported on MongoDB)
  --exit-code              Change the exit code behavior to signal if the diff is empty or not (Empty: 0, Error: 1, Not empty: 2). Default behavior is Success: 0, Error: 1.

