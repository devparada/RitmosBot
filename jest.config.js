/** @type {import('jest').Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    collectCoverage: false,
    coverageProvider: "v8",
    moduleNameMapper: {
        "^src/(.*)$": "<rootDir>/src/$1",
        "^@/(.*)$": "<rootDir>/src/$1",
        "^@tests/(.*)$": "<rootDir>/tests/$1",
    },
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.test.json",
            },
        ],
    },
    moduleFileExtensions: ["ts", "js"],
};
