module.exports = {
  validUser: { username: 'admin', password: 'jayapriya@123' },

  invalidCombinations: [
    { id: 'TC_LOGIN_N01', label: 'Invalid username, valid password', username: 'wronguser', password: 'jayapriya@123' },
    { id: 'TC_LOGIN_N02', label: 'Valid username, invalid password', username: 'admin', password: 'wrongpass' },
    { id: 'TC_LOGIN_N03', label: 'Invalid username, invalid password', username: 'wronguser', password: 'wrongpass' },
    { id: 'TC_LOGIN_N04', label: 'Correct username wrong case', username: 'ADMIN', password: 'jayapriya@123' },
    { id: 'TC_LOGIN_N05', label: 'Password with trailing space', username: 'admin', password: 'jayapriya@123 ' },
  ],

  specialCharacterPayloads: [
    { id: 'TC_LOGIN_SC01', label: 'SQL injection style payload', username: "admin' OR '1'='1", password: "' OR '1'='1" },
    { id: 'TC_LOGIN_SC02', label: 'XSS script payload', username: '<script>alert(1)</script>', password: '<script>alert(1)</script>' },
    { id: 'TC_LOGIN_SC03', label: 'Special characters', username: '!@#$%^&*()_+-={}[]:;\'"<>?/\\|~', password: '!@#$%^&*()_+-={}[]:;\'"<>?/\\|~' },
    { id: 'TC_LOGIN_SC04', label: 'Unicode/emoji', username: '管理员😀', password: '密码😀' },
  ],

  boundaryPayloads: [
    { id: 'TC_LOGIN_BV01', label: 'Single character username/password', username: 'a', password: 'a' },
    { id: 'TC_LOGIN_BV02', label: 'Very long username (500 chars)', username: 'a'.repeat(500), password: 'jayapriya@123' },
    { id: 'TC_LOGIN_BV03', label: 'Very long password (500 chars)', username: 'admin', password: 'a'.repeat(500) },
    { id: 'TC_LOGIN_BV04', label: 'Whitespace-only username', username: '   ', password: 'jayapriya@123' },
    { id: 'TC_LOGIN_BV05', label: 'Whitespace-only password', username: 'admin', password: '   ' },
  ],
};
