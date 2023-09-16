/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateSaveFile = /* GraphQL */ `
  subscription OnCreateSaveFile(
    $filter: ModelSubscriptionSaveFileFilterInput
    $userId: String
  ) {
    onCreateSaveFile(filter: $filter, userId: $userId) {
      id
      userId
      game {
        id
        title
        description
        filePath
        createdAt
        updatedAt
        __typename
      }
      data
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateSaveFile = /* GraphQL */ `
  subscription OnUpdateSaveFile(
    $filter: ModelSubscriptionSaveFileFilterInput
    $userId: String
  ) {
    onUpdateSaveFile(filter: $filter, userId: $userId) {
      id
      userId
      game {
        id
        title
        description
        filePath
        createdAt
        updatedAt
        __typename
      }
      data
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteSaveFile = /* GraphQL */ `
  subscription OnDeleteSaveFile(
    $filter: ModelSubscriptionSaveFileFilterInput
    $userId: String
  ) {
    onDeleteSaveFile(filter: $filter, userId: $userId) {
      id
      userId
      game {
        id
        title
        description
        filePath
        createdAt
        updatedAt
        __typename
      }
      data
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateGame = /* GraphQL */ `
  subscription OnCreateGame($filter: ModelSubscriptionGameFilterInput) {
    onCreateGame(filter: $filter) {
      id
      title
      description
      filePath
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateGame = /* GraphQL */ `
  subscription OnUpdateGame($filter: ModelSubscriptionGameFilterInput) {
    onUpdateGame(filter: $filter) {
      id
      title
      description
      filePath
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteGame = /* GraphQL */ `
  subscription OnDeleteGame($filter: ModelSubscriptionGameFilterInput) {
    onDeleteGame(filter: $filter) {
      id
      title
      description
      filePath
      createdAt
      updatedAt
      __typename
    }
  }
`;
