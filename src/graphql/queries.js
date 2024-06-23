/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getGame = /* GraphQL */ `
  query GetGame($id: ID!) {
    getGame(id: $id) {
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
export const listGames = /* GraphQL */ `
  query ListGames(
    $filter: ModelGameFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGames(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getSaveState = /* GraphQL */ `
  query GetSaveState($id: ID!) {
    getSaveState(id: $id) {
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
export const listSaveStates = /* GraphQL */ `
  query ListSaveStates(
    $filter: ModelSaveStateFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSaveStates(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        owner
        filePath
        title
        description
        img
        createdAt
        updatedAt
        gameSaveStatesId
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getUserProfile = /* GraphQL */ `
  query GetUserProfile($id: ID!) {
    getUserProfile(id: $id) {
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
export const listUserProfiles = /* GraphQL */ `
  query ListUserProfiles(
    $filter: ModelUserProfileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
