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
      img
      filePath
      saveStates {
        items {
          id
          data
          title
          description
          createdAt
          updatedAt
          gameSaveStatesId
          owner
          __typename
        }
        nextToken
        __typename
      }
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
      img
      filePath
      saveStates {
        items {
          id
          data
          title
          description
          createdAt
          updatedAt
          gameSaveStatesId
          owner
          __typename
        }
        nextToken
        __typename
      }
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
      img
      filePath
      saveStates {
        items {
          id
          data
          title
          description
          createdAt
          updatedAt
          gameSaveStatesId
          owner
          __typename
        }
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createSaveState = /* GraphQL */ `
  mutation CreateSaveState(
    $input: CreateSaveStateInput!
    $condition: ModelSaveStateConditionInput
  ) {
    createSaveState(input: $input, condition: $condition) {
      id
      game {
        id
        title
        description
        img
        filePath
        saveStates {
          nextToken
          __typename
        }
        createdAt
        updatedAt
        __typename
      }
      data
      title
      description
      createdAt
      updatedAt
      gameSaveStatesId
      owner
      __typename
    }
  }
`;
export const updateSaveState = /* GraphQL */ `
  mutation UpdateSaveState(
    $input: UpdateSaveStateInput!
    $condition: ModelSaveStateConditionInput
  ) {
    updateSaveState(input: $input, condition: $condition) {
      id
      game {
        id
        title
        description
        img
        filePath
        saveStates {
          nextToken
          __typename
        }
        createdAt
        updatedAt
        __typename
      }
      data
      title
      description
      createdAt
      updatedAt
      gameSaveStatesId
      owner
      __typename
    }
  }
`;
export const deleteSaveState = /* GraphQL */ `
  mutation DeleteSaveState(
    $input: DeleteSaveStateInput!
    $condition: ModelSaveStateConditionInput
  ) {
    deleteSaveState(input: $input, condition: $condition) {
      id
      game {
        id
        title
        description
        img
        filePath
        saveStates {
          nextToken
          __typename
        }
        createdAt
        updatedAt
        __typename
      }
      data
      title
      description
      createdAt
      updatedAt
      gameSaveStatesId
      owner
      __typename
    }
  }
`;
