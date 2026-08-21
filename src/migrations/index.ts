import * as migration_20260821_161139_initial from './20260821_161139_initial';
import * as migration_20260821_161200_users_role_default from './20260821_161200_users_role_default';
import * as migration_20260821_192800_admin_role from './20260821_192800_admin_role';

export const migrations = [
  {
    up: migration_20260821_161139_initial.up,
    down: migration_20260821_161139_initial.down,
    name: '20260821_161139_initial'
  },
  {
    up: migration_20260821_161200_users_role_default.up,
    down: migration_20260821_161200_users_role_default.down,
    name: '20260821_161200_users_role_default'
  },
  {
    up: migration_20260821_192800_admin_role.up,
    down: migration_20260821_192800_admin_role.down,
    name: '20260821_192800_admin_role'
  },
];
