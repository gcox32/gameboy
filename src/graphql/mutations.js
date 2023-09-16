/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createGame = /* GraphQL */ `
  mutation CreateGame(
    $input: CreateGameInput!
    $condition: ModelGameConditionInput
  ) {
    createGame(input: $input, condition: $condition) {
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
export const updateGame = /* GraphQL */ `
  mutation UpdateGame(
    $input: UpdateGameInput!
    $condition: ModelGameConditionInput
  ) {
    updateGame(input: $input, condition: $condition) {
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
export const deleteGame = /* GraphQL */ `
  mutation DeleteGame(
    $input: DeleteGameInput!
    $condition: ModelGameConditionInput
  ) {
    deleteGame(input: $input, condition: $condition) {
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
export const createSaveFile = /* GraphQL */ `
  mutation CreateSaveFile(
    $input: CreateSaveFileInput!
    $condition: ModelSaveFileConditionInput
  ) {
    createSaveFile(input: $input, condition: $condition) {
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
export const updateSaveFile = /* GraphQL */ `
  mutation UpdateSaveFile(
    $input: UpdateSaveFileInput!
    $condition: ModelSaveFileConditionInput
  ) {
    updateSaveFile(input: $input, condition: $condition) {
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
export const deleteSaveFile = /* GraphQL */ `
  mutation DeleteSaveFile(
    $input: DeleteSaveFileInput!
    $condition: ModelSaveFileConditionInput
  ) {
    deleteSaveFile(input: $input, condition: $condition) {
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
