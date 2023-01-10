import MockAdapter from 'axios-mock-adapter';

import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { initializeMockApp } from '@edx/frontend-platform/testing';

import { initializeStore } from '../../../store';
import { getDiscussionTourUrl } from './api';
import { notRespondedFilterTour } from './selectors';
import {
  fetchUserDiscussionsToursError,
  fetchUserDiscussionsToursRequest,
  fetchUserDiscussionsToursSuccess,
  toursReducer,
  updateUserDiscussionsTourError,
  updateUserDiscussionsTourRequest,
  updateUserDiscussionsTourSuccess,
} from './slices';
import { fetchDiscussionTours, updateTourShowStatus } from './thunks';
import discussionTourFactory from './tours.factory';

let mockAxios;
// eslint-disable-next-line no-unused-vars
let store;
const url = getDiscussionTourUrl();
describe('DiscussionToursThunk', () => {
  let actualActions;

  const dispatch = (action) => {
    actualActions.push(action);
  };

  beforeEach(() => {
    initializeMockApp({
      authenticatedUser: {
        userId: 3,
        username: 'abc123',
        administrator: true,
        roles: [],
      },
    });
    mockAxios = new MockAdapter(getAuthenticatedHttpClient());
    store = initializeStore();
    actualActions = [];
  });

  afterEach(() => {
    mockAxios.reset();
  });

  it('dispatches get request, success actions', async () => {
    const mockData = discussionTourFactory.buildList(2);
    mockAxios.onGet(url)
      .reply(200, mockData);

    const expectedActions = [
      {
        payload: undefined,
        type: 'userDiscussionsTours/fetchUserDiscussionsToursRequest',
      },
      {
        type: 'userDiscussionsTours/fetchUserDiscussionsToursSuccess',
        payload: mockData,
      },
    ];
    await fetchDiscussionTours()(dispatch);
    expect(actualActions)
      .toEqual(expectedActions);
  });

  it('dispatches request, and error actions', async () => {
    mockAxios.onGet('/api/discussion-tours/')
      .reply(500);
    const errorAction = [{
      payload: undefined,
      type: 'userDiscussionsTours/fetchUserDiscussionsToursRequest',
    }, {
      payload: undefined,
      type: 'userDiscussionsTours/fetchUserDiscussionsToursError',
    }];

    await fetchDiscussionTours()(dispatch);
    expect(actualActions)
      .toEqual(errorAction);
  });

  it('dispatches put request, success actions', async () => {
    const mockData = discussionTourFactory.build();
    mockAxios.onPut(`${url}${1}`)
      .reply(200, mockData);

    const expectedActions = [
      {
        payload: undefined,
        type: 'userDiscussionsTours/updateUserDiscussionsTourRequest',
      },
      {
        type: 'userDiscussionsTours/updateUserDiscussionsTourSuccess',
        payload: mockData,
      },
    ];
    await updateTourShowStatus(1)(dispatch);
    expect(actualActions)
      .toEqual(expectedActions);
  });

  it('dispatches update request, and error actions', async () => {
    mockAxios.onPut(`${url}${1}`)
      .reply(500);
    const errorAction = [{
      payload: undefined,
      type: 'userDiscussionsTours/updateUserDiscussionsTourRequest',
    }, {
      payload: undefined,
      type: 'userDiscussionsTours/updateUserDiscussionsTourError',
    }];

    await updateTourShowStatus(1)(dispatch);
    expect(actualActions)
      .toEqual(errorAction);
  });
});

describe('toursReducer', () => {
  it('handles the fetchUserDiscussionsToursRequest action', () => {
    const initialState = {
      tours: [],
      loading: false,
      error: null,
    };
    const state = toursReducer(initialState, fetchUserDiscussionsToursRequest());
    expect(state)
      .toEqual({
        tours: [],
        loading: true,
        error: null,
      });
  });

  it('handles the fetchUserDiscussionsToursSuccess action', () => {
    const initialState = {
      tours: [],
      loading: true,
      error: null,
    };
    const mockData = [{ id: 1 }, { id: 2 }];
    const state = toursReducer(initialState, fetchUserDiscussionsToursSuccess(mockData));
    expect(state)
      .toEqual({
        tours: mockData,
        loading: false,
        error: null,
      });
  });

  it('handles the fetchUserDiscussionsToursError action', () => {
    const initialState = {
      tours: [],
      loading: true,
      error: null,
    };
    const mockError = new Error('Something went wrong');
    const state = toursReducer(initialState, fetchUserDiscussionsToursError(mockError));
    expect(state)
      .toEqual({
        tours: [],
        loading: false,
        error: mockError,
      });
  });

  it('handles the updateUserDiscussionsTourRequest action', () => {
    const initialState = {
      tours: [],
      loading: false,
      error: null,
    };
    const state = toursReducer(initialState, updateUserDiscussionsTourRequest());
    expect(state)
      .toEqual({
        tours: [],
        loading: true,
        error: null,
      });
  });

  it('handles the updateUserDiscussionsTourSuccess action', () => {
    const initialState = {
      tours: {
        tours: [{ id: 1 }, { id: 2 }],
        loading: true,
        error: null,
      },
    };
    const updatedTour = {
      id: 2,
      name: 'Updated Tour',
    };
    const state = toursReducer(initialState, updateUserDiscussionsTourSuccess(updatedTour));
    expect(state.tours)
      .toEqual({
        tours: [{ id: 1 }, updatedTour],
        loading: false,
        error: null,
      });
  });

  it('handles the updateUserDiscussionsTourError action', () => {
    const initialState = {
      tours: [],
      loading: true,
      error: null,
    };
    const mockError = new Error('Something went wrong');
    const state = toursReducer(initialState, updateUserDiscussionsTourError(mockError));
    expect(state)
      .toEqual({
        tours: [],
        loading: false,
        error: mockError,
      });
  });
});

describe('notRespondedFilterTour', () => {
  it('filters the tours list by the "not_responded_filter" tour name', () => {
    const state = {
      tours: {
        tours: [
          { id: 1, tourName: 'not_responded_filter' },
          { id: 2, tourName: 'other_filter' },
        ],
      },
    };
    const expectedResult = { id: 1, tourName: 'not_responded_filter' };
    expect(notRespondedFilterTour(state)).toEqual(expectedResult);
  });

  it('returns an empty object if the tours state is not defined', () => {
    const state = {};
    expect(notRespondedFilterTour(state)).toEqual({});
  });

  it('returns an empty object if the tours state does not contain not_responded_filter', () => {
    const state = {
      tours: {
        tours: [
          { id: 1, tourName: 'other_data' },
          { id: 2, tourName: 'other_data_1' },
        ],
      },
    };
    expect(notRespondedFilterTour(state)).toEqual({});
  });
});
