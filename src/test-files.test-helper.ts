import {dirname, join} from 'path';

const repoRootDirPath = dirname(dirname(__filename));

const testFilesDirPath = join(repoRootDirPath, 'test-files');

export const expectationFiles = {
    emptyExpectationFile: join(testFilesDirPath, 'empty.json'),
    missingExpectationFile: join(testFilesDirPath, 'missing.json'),
    fullExpectationFile: join(testFilesDirPath, 'full.json'),
    notAnObjectExpectationFile: join(testFilesDirPath, 'non-object.json'),
    nonObjectChildExpectationFile: join(testFilesDirPath, 'non-object-child.json'),
};
