const { withPodfile } = require('expo/config-plugins');

// fmt 11.0.2's consteval checks fail with Apple Clang 21 (Xcode 26.4/27).
// Patch the shared header so every consumer uses the same configuration.
// https://github.com/fmtlib/fmt/issues/4740
const marker = '# GIK: fmt 11.0.2 Apple Clang compatibility';
const workaround = `
  ${marker}
  fmt_base = File.join(installer.sandbox.pod_dir('fmt'), 'include', 'fmt', 'base.h')
  if File.exist?(fmt_base)
    original = File.read(fmt_base)
    if original.include?('#define FMT_VERSION 110002')
      patched = original.sub(
        '#elif defined(__cpp_consteval)',
        "#elif defined(__apple_build_version__) && __clang_major__ >= 21\\n#  define FMT_USE_CONSTEVAL 0\\n#elif defined(__cpp_consteval)"
      ) unless original.include?('__clang_major__ >= 21')
      if patched && patched != original
        File.chmod(0644, fmt_base)
        File.write(fmt_base, patched)
      end
    end
  end
`;

function patchPodfile(contents) {
  if (contents.includes(marker)) return contents;
  const hook = 'post_install do |installer|';
  if (!contents.includes(hook)) {
    throw new Error('Cannot apply fmt workaround: CocoaPods post_install hook is missing.');
  }
  return contents.replace(hook, `${hook}\n${workaround}`);
}

module.exports = (config) => withPodfile(config, (mod) => {
  mod.modResults.contents = patchPodfile(mod.modResults.contents);
  return mod;
});
module.exports.patchPodfile = patchPodfile;
