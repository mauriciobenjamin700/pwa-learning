import { useAppDispatch, useAppSelector } from '@/hooks';
import { setUser, clearUser } from '@/store/userSlice';

/**
 * Simple user management hook for login and logout functionality.
 * This hook provides a way to manage user state in a React application using Redux.
 * He return current user state and functions to login and logout.
 * @returns { user, login, logout }
 */
export function useUser() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);

  function login(userData: UserResponse) {
    dispatch(setUser({ user: userData }));
  }

  function logout() {
    dispatch(clearUser());
  }

  return { user, login, logout };
}