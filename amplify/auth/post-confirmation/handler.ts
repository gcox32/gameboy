import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from "$amplify/env/post-confirmation";
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient();

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig({
  ...env,
  AMPLIFY_DATA_DEFAULT_NAME: 'default'
});
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  try {
    // Add user to member group
    const addToGroupCommand = new AdminAddUserToGroupCommand({
      GroupName: "member",
      Username: event.userName,
      UserPoolId: event.userPoolId
    });
    await cognitoClient.send(addToGroupCommand);

    const userSub = event.request.userAttributes.sub;
    const userEmail = event.request.userAttributes.email;

    await Promise.all([
      // Create user record
      client.models.Profile.create({
        id: userSub,
        owner: userSub,
        username: userEmail,
        email: userEmail,
        avatar: '',
        bio: '',
      }),
    ]);

    return event;
  } catch (error) {
    console.error('Error in post confirmation handler:', error);
    throw error;
  }
};