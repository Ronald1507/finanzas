import { httpClient } from '../../../services/httpClient';

export const authService = {
    register: (data) => httpClient.post('/register', data),
    login:    (data) => httpClient.post('/login', data),
    logout:   ()     => httpClient.post('/logout'),
    me:       ()     => httpClient.get('/me'),
};
