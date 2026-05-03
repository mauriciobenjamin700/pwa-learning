import Cookies from "js-cookie";

const SEVEN_DAYS = 7;

export const cookieGet = (name: string): string | undefined => Cookies.get(name);

export const cookieSet = (
  name: string,
  value: string,
  days = SEVEN_DAYS,
): void => {
  Cookies.set(name, value, { expires: days, sameSite: "lax", secure: false });
};

export const cookieDelete = (name: string): void => {
  Cookies.remove(name);
};
