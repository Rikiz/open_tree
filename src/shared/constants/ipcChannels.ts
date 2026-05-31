export const IPC = {
  // Repo
  REPO_LIST: 'repo:list',
  REPO_ADD: 'repo:add',
  REPO_REMOVE: 'repo:remove',
  REPO_OPEN: 'repo:open',

  // Dialog
  DIALOG_OPEN_DIR: 'dialog:openDirectory',
  DIALOG_OPEN_FILE: 'dialog:openFile',
  DIALOG_SAVE_FILE: 'dialog:saveFile',

  // Git
  GIT_STATUS: 'git:status',
  GIT_CLONE: 'git:clone',
  GIT_INIT: 'git:init',
  GIT_IS_REPO: 'git:isRepo',
  GIT_COMMIT: 'git:commit',
  GIT_ADD: 'git:add',
  GIT_UNSTAGE: 'git:unstage',
  GIT_DIFF: 'git:diff',
  GIT_LOG: 'git:log',
  GIT_LIST_BRANCHES: 'git:listBranches',
  GIT_LIST_REMOTE_BRANCHES: 'git:listRemoteBranches',
  GIT_CREATE_BRANCH: 'git:createBranch',
  GIT_DELETE_BRANCH: 'git:deleteBranch',
  GIT_CHECKOUT: 'git:checkout',
  GIT_CHECKOUT_FILE: 'git:checkoutFile',
  GIT_CLEAN_FILE: 'git:cleanFile',
  GIT_PUSH: 'git:push',
  GIT_PULL: 'git:pull',
  GIT_FETCH: 'git:fetch',
  GIT_MERGE: 'git:merge',
  GIT_STASH: 'git:stash',
  GIT_LIST_STASHES: 'git:listStashes',
  GIT_STASH_APPLY: 'git:stashApply',
  GIT_STASH_DROP: 'git:stashDrop',
  GIT_STASH_SHOW: 'git:stashShow',
  GIT_LIST_TAGS: 'git:listTags',
  GIT_CREATE_TAG: 'git:createTag',
  GIT_CHERRY_PICK: 'git:cherryPick',
  GIT_RESET: 'git:reset',
  GIT_CONFIG: 'git:config',
  GIT_SET_CONFIG: 'git:setConfig',
  GIT_PROGRESS: 'git:progress',
  GIT_COMMIT_DETAIL: 'git:commitDetail',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Auth
  AUTH_LOGIN: 'auth:login',
  AUTH_GET_TOKEN: 'auth:getToken',
  AUTH_LIST_ACCOUNTS: 'auth:listAccounts',
  AUTH_REMOVE_ACCOUNT: 'auth:removeAccount',

  // SSH
  SSH_LIST_KEYS: 'ssh:listKeys',
  SSH_GENERATE_KEY: 'ssh:generateKey',
  SSH_TEST_CONNECTION: 'ssh:testConnection',
  SSH_COPY_PUBLIC_KEY: 'ssh:copyPublicKey',
  SSH_DELETE_KEY: 'ssh:deleteKey',

  // Clipboard
  CLIPBOARD_WRITE: 'clipboard:write',
} as const
