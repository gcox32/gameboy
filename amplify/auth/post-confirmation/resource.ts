import { defineFunction } from '@aws-amplify/backend';

export const postConfirmation = defineFunction({
  name: 'post-confirmation',
  environment: {
    GROUP_NAME: 'member'
  },
  resourceGroupName: 'auth'
});