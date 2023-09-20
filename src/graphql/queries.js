/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getGame = /* GraphQL */ `
  query GetGame($id: ID!) {
    getGame(id: $id) {
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
export const listGames = /* GraphQL */ `
  query ListGames(
    $filter: ModelGameFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGames(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getSaveState = /* GraphQL */ `
  query GetSaveState($id: ID!) {
    getSaveState(id: $id) {
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
export const listSaveStates = /* GraphQL */ `
  query ListSaveStates(
    $filter: ModelSaveStateFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSaveStates(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        game {
          id
          title
          description
          img
          filePath
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
      nextToken
      __typename
    }
  }
`;
