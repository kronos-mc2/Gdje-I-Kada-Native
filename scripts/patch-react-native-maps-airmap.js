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
const methodReplacement = `${methodNeedle}    if (subview == nil) {\n        return;\n    }\n`;

if (!patched.includes(methodNeedle)) {
  console.warn('react-native-maps AIRMap insertReactSubview signature changed; skipping nil subview guard patch.');
  process.exit(0);
}

if (!patched.includes('if (subview == nil) {\n        return;\n    }')) {
  patched = patched.replace(methodNeedle, methodReplacement);
}

const childNeedle = `        for (int i = 0; i < childSubviews.count; i++) {
            [self insertReactSubview:(UIView *)childSubviews[i] atIndex:atIndex];
        }
`;
const childReplacement = `        for (int i = 0; i < childSubviews.count; i++) {
            id<RCTComponent> childSubview = childSubviews[i];
            if (childSubview != nil) {
                [self insertReactSubview:(UIView *)childSubview atIndex:atIndex];
            }
        }
`;

patched = patched.replace(childNeedle, childReplacement);

if (patched !== source) {
  fs.writeFileSync(airMapPath, patched);
  console.log('Patched react-native-maps AIRMap nil subview guard.');
} else {
  console.log('react-native-maps AIRMap nil subview guard already applied.');
}
