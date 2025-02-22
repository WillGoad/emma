export const isValidPassword = (password: string) => {
  const minLength = 20;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid:
      password.length >= minLength &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecialChar,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  };
};

export const generateSecurePassword = () => {
    const getRandomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specialChars = `!@#$%^&*(),.?":{}|<>`;

    // Generate 18 random lowercase letters
    let passwordArray = Array.from({ length: 18 }, () => getRandomChar(lowercase));

    // Get three unique positions for inserting uppercase, number, and special character
    let positions: Set<number> = new Set();
    while (positions.size < 3) {
        positions.add(Math.floor(Math.random() * 18));
    }
    const posArray: number[] = [...positions]; // Convert set to array

    // Insert characters at unique positions
    passwordArray[posArray[0]] = getRandomChar(uppercase);
    passwordArray[posArray[1]] = getRandomChar(numbers);
    passwordArray[posArray[2]] = getRandomChar(specialChars);

    // Format the password as xxxxxx-xxxxxx-xxxxxx
    return `${passwordArray.slice(0, 6).join('')}-${passwordArray.slice(6, 12).join('')}-${passwordArray.slice(12, 18).join('')}`;
}

