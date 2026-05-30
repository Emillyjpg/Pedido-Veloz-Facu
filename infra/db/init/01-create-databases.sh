#!/bin/bash
set -e

# Create multiple databases from POSTGRES_MULTIPLE_DATABASES env var
# Format: db1:user1:pass1,db2:user2:pass2

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
  IFS=',' read -ra DBS <<< "$POSTGRES_MULTIPLE_DATABASES"
  for db_entry in "${DBS[@]}"; do
    IFS=':' read -r db user pass <<< "$db_entry"
    echo "Creating database '$db' with user '$user'"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
      CREATE USER $user WITH PASSWORD '$pass';
      CREATE DATABASE $db OWNER $user;
      GRANT ALL PRIVILEGES ON DATABASE $db TO $user;
EOSQL
  done
fi
