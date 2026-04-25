const fs = require('node:fs');
const path = require('node:path');

const packageJsonPath = require.resolve('react-native-maps/package.json');
const airMapPath = path.join(path.dirname(packageJsonPath), 'ios', 'AirMaps', 'AIRMap.m');

if (!fs.existsSync(airMapPath)) {
  console.warn(`react-native-maps AIRMap.m not found at ${airMapPath}; skipping nil subview guard patch.`);
  process.exit(0);
}

let source = fs.readFileSync(airMapPath, 'utf8');
let patched = source;

const methodNeedle = '- (void)insertReactSubview:(id<RCTComponent>)subview atIndex:(NSInteger)atIndex {\n';
const methodReplacement = `${methodNeedle}    if (subview == nil) {\n        return;\n    }\n\n    NSInteger normalizedIndex = MAX(0, MIN(atIndex, (NSInteger)_reactSubviews.count));\n`;

if (!patched.includes(methodNeedle)) {
  console.warn('react-native-maps AIRMap insertReactSubview signature changed; skipping nil subview guard patch.');
  process.exit(0);
}

if (!patched.includes('if (subview == nil) {\n        return;\n    }')) {
  patched = patched.replace(methodNeedle, methodReplacement);
}

if (!patched.includes('NSInteger normalizedIndex = MAX(0, MIN(atIndex, (NSInteger)_reactSubviews.count));')) {
  patched = patched.replace(
    '    // Our desired API is to pass up markers/overlays as children to the mapview component.\n',
    '    NSInteger normalizedIndex = MAX(0, MIN(atIndex, (NSInteger)_reactSubviews.count));\n\n    // Our desired API is to pass up markers/overlays as children to the mapview component.\n',
  );
}

const childNeedle = `        for (int i = 0; i < childSubviews.count; i++) {
            [self insertReactSubview:(UIView *)childSubviews[i] atIndex:atIndex];
        }
`;
const childReplacement = `        for (int i = 0; i < childSubviews.count; i++) {
            id<RCTComponent> childSubview = childSubviews[i];
            if (childSubview != nil) {
                [self insertReactSubview:(UIView *)childSubview atIndex:normalizedIndex];
            }
        }
`;

patched = patched.replace(childNeedle, childReplacement);
patched = patched.replace(
  '[self insertReactSubview:(UIView *)childSubview atIndex:atIndex];\n',
  '[self insertReactSubview:(UIView *)childSubview atIndex:normalizedIndex];\n',
);
patched = patched.replace(
  '    [_reactSubviews insertObject:(UIView *)subview atIndex:(NSUInteger) atIndex];\n',
  '    [_reactSubviews insertObject:(UIView *)subview atIndex:(NSUInteger) normalizedIndex];\n',
);

if (patched !== source) {
  fs.writeFileSync(airMapPath, patched);
  console.log('Patched react-native-maps AIRMap nil subview guard.');
} else {
  console.log('react-native-maps AIRMap nil subview guard already applied.');
}
