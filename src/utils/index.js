import axios from 'axios';
import config from 'config';

export { default as Auth } from './Auth';
export { default as colors } from './colors';
export { default as media } from './media';
export { default as permissions } from './permissions';

export const api = axios.create({
  baseURL: config.api.endpoint,
});

api.interceptors.request.use(request => {
  request.headers.Authorization = `Bearer ${localStorage.getItem('id_token')}`;
  request.headers.Space = localStorage.getItem('space');
  return request;
});

export const Throw = message => () => {
  throw new Error(message);
};

export const acronym = string => string.match(/\b(\w)/g).join('');
