import { useAppDispatch, useAppSelector } from '@/hooks';
import { setUser, clearUser } from '@/store/userSlice';

/**
 * Simple user management hook for login and logout functionality.
 * This hook provides a way to manage user state in a React application using Redux.
 * He return current user state
 * @returns { UserResponse | null } - The current user state or null if not logged in.
 */
export function useGetUser() : UserResponse | null {
  const user = useAppSelector(state => state.user);
  return user.user;
}

export function useSetUser() {
  const dispatch = useAppDispatch();

  function set(userData: UserResponse) {
    dispatch(setUser({ user: userData }));
  }

  return set;
}

export function userResetUser() {
  const dispatch = useAppDispatch();

  function reset() {
    dispatch(clearUser());
  }

  return reset;
}