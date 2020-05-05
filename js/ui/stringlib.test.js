/* global test, expect */
import { assertMatchNoError, shell, execOpts } from '../testlib'

const COMPILE_EXEC = 'eval "$(./dist/rollup-bash.sh bash/ui/stringlib.func.sh -)"'

describe('field-to-label', () => {
  test.each`
  input | output
  ${`FOO`} | ${'Foo'}
  ${`FOO_BAR`} | ${'Foo bar'}
  ${`FOO BAR`} | ${'Foo bar'}
  ${`Foo bar`} | ${'Foo bar'}
  ${``} | ${''}
  `(`$input -> $output`, ({input, output}) => {
    const result = shell.exec(`${COMPILE_EXEC} && echo -n $(field-to-label "${input}")`, execOpts)
    const expectedOut = expect.stringMatching(output)
    assertMatchNoError(result, expectedOut)
  })
})

describe('echo-label-and-values', () => {
  test('handles empty value', () => {
    const result = shell.exec(`${COMPILE_EXEC} && echo -n $(echo-label-and-values FOO '')`, execOpts)
    const expectedOut = expect.stringMatching("Foo:")
    assertMatchNoError(result, expectedOut)
  })

  test('displays single value on the same line', () => {
    const result = shell.exec(`${COMPILE_EXEC} && echo -n $(echo-label-and-values FOO bar)`, execOpts)
    const expectedOut = expect.stringMatching("Foo: bar")
    assertMatchNoError(result, expectedOut)
  })

  test('displays multiple values on the same line', () => {
    const result = shell.exec(`${COMPILE_EXEC} && { VALS=bar$'\\n'baz; echo -n "$(echo-label-and-values FOO "$VALS"; )";}`, execOpts)
    const expectedOut = expect.stringMatching(/^Foo:\s*\n   bar\n   baz$/m)
    assertMatchNoError(result, expectedOut)
  })

  test(`handles single 'field' var`, () => {
    const result = shell.exec(`${COMPILE_EXEC} && { FOO=bar; echo -n $(echo-label-and-values FOO); }`, execOpts)
    const expectedOut = expect.stringMatching("Foo: bar")
    assertMatchNoError(result, expectedOut)
  })
})
