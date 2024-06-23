/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateGame = /* GraphQL */ `
  subscription OnCreateGame($filter: ModelSubscriptionGameFilterInput) {
    onCreateGame(filter: $filter) {
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
export const onUpdateGame = /* GraphQL */ `
  subscription OnUpdateGame($filter: ModelSubscriptionGameFilterInput) {
    onUpdateGame(filter: $filter) {
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
export const onDeleteGame = /* GraphQL */ `
  subscription OnDeleteGame($filter: ModelSubscriptionGameFilterInput) {
    onDeleteGame(filter: $filter) {
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
export const onCreateSaveState = /* GraphQL */ `
  subscription OnCreateSaveState(
    $filter: ModelSubscriptionSaveStateFilterInput
  ) {
    onCreateSaveState(filter: $filter) {
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
export const onUpdateSaveState = /* GraphQL */ `
  subscription OnUpdateSaveState(
    $filter: ModelSubscriptionSaveStateFilterInput
  ) {
    onUpdateSaveState(filter: $filter) {
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
export const onDeleteSaveState = /* GraphQL */ `
  subscription OnDeleteSaveState(
    $filter: ModelSubscriptionSaveStateFilterInput
  ) {
    onDeleteSaveState(filter: $filter) {
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
export const onCreateUserProfile = /* GraphQL */ `
  subscription OnCreateUserProfile(
    $filter: ModelSubscriptionUserProfileFilterInput
  ) {
    onCreateUserProfile(filter: $filter) {
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
export const onUpdateUserProfile = /* GraphQL */ `
  subscription OnUpdateUserProfile(
    $filter: ModelSubscriptionUserProfileFilterInput
  ) {
    onUpdateUserProfile(filter: $filter) {
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
export const onDeleteUserProfile = /* GraphQL */ `
  subscription OnDeleteUserProfile(
    $filter: ModelSubscriptionUserProfileFilterInput
  ) {
    onDeleteUserProfile(filter: $filter) {
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
