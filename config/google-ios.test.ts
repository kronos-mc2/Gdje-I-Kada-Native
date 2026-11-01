import { withGoogleIosUrlScheme } from './google-ios';

it('replaces stale Google callbacks while preserving app deep links', () => {
  const info = { CFBundleURLTypes: [{ CFBundleURLSchemes: ['gdjeikadanative-test', 'com.googleusercontent.apps.old'] }] };
  const result = withGoogleIosUrlScheme(info, 'test-client.apps.googleusercontent.com');
  expect(result.CFBundleURLTypes).toEqual([
    { CFBundleURLSchemes: ['gdjeikadanative-test'] },
    { CFBundleURLSchemes: ['com.googleusercontent.apps.test-client'] },
  ]);
  expect(withGoogleIosUrlScheme(result, 'test-client.apps.googleusercontent.com')).toEqual(result);
});

it('rejects placeholder iOS credentials', () => {
  expect(() => withGoogleIosUrlScheme({}, 'your-test-client.apps.googleusercontent.com')).toThrow();
});
