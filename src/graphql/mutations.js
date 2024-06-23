/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createGame = /* GraphQL */ `
  mutation CreateGame(
    $input: CreateGameInput!
    $condition: ModelGameConditionInput
  ) {
    createGame(input: $input, condition: $condition) {
      id
      owner
      title
      releaseDate
      description
      img
      filePath
      saveStates {
        nextToken
        __typename
      }
      backgroundImg
      series
      generation
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
      owner
      title
      releaseDate
      description
      img
      filePath
      saveStates {
        nextToken
        __typename
      }
      backgroundImg
      series
      generation
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
      owner
      title
      releaseDate
      description
      img
      filePath
      saveStates {
        nextToken
        __typename
      }
      backgroundImg
      series
      generation
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
      owner
      game {
        id
        owner
        title
        releaseDate
        description
        img
        filePath
        backgroundImg
        series
        generation
        createdAt
        updatedAt
        __typename
      }
      filePath
      title
      description
      img
      createdAt
      updatedAt
      gameSaveStatesId
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
      owner
      game {
        id
        owner
        title
        releaseDate
        description
        img
        filePath
        backgroundImg
        series
        generation
        createdAt
        updatedAt
        __typename
      }
      filePath
      title
      description
      img
      createdAt
      updatedAt
      gameSaveStatesId
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
      owner
      game {
        id
        owner
        title
        releaseDate
        description
        img
        filePath
        backgroundImg
        series
        generation
        createdAt
        updatedAt
        __typename
      }
      filePath
      title
      description
      img
      createdAt
      updatedAt
      gameSaveStatesId
      __typename
    }
  }
`;
export const createUserProfile = /* GraphQL */ `
  mutation CreateUserProfile(
    $input: CreateUserProfileInput!
    $condition: ModelUserProfileConditionInput
  ) {
    createUserProfile(input: $input, condition: $condition) {
      id
      owner
      username
      email
      avatar
      bio
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateUserProfile = /* GraphQL */ `
  mutation UpdateUserProfile(
    $input: UpdateUserProfileInput!
    $condition: ModelUserProfileConditionInput
  ) {
    updateUserProfile(input: $input, condition: $condition) {
      id
      owner
      username
      email
      avatar
      bio
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteUserProfile = /* GraphQL */ `
  mutation DeleteUserProfile(
    $input: DeleteUserProfileInput!
    $condition: ModelUserProfileConditionInput
  ) {
    deleteUserProfile(input: $input, condition: $condition) {
      id
      owner
      username
      email
      avatar
      bio
      createdAt
      updatedAt
      __typename
    }
  }
`;
