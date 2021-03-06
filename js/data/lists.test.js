/* global test, expect */
import { assertMatchNoError, shell, execOpts } from '../testlib'

describe('list-add-item', () => {
  test('should append items', () => {
    const result =
      shell.exec(`set -e; source src/data/lists.func.sh; LIST=''; list-add-item LIST a; echo "1: $LIST"; list-add-item LIST b; echo -n "2: $LIST"`, execOpts)
    const expectedOut = expect.stringMatching(/^1: a\n2: a\nb$/)
    assertMatchNoError(result, expectedOut)
  })

  test('should handle spaces within items', () => {
    const result =
      shell.exec(`set -e; source src/data/lists.func.sh; LIST=''; list-add-item LIST 'a b'; echo -e "$LIST"; list-add-item LIST 'c d'; echo -en "$LIST"`, execOpts)
    const expectedOut = expect.stringMatching(/^a b\na b\nc d$/)
    assertMatchNoError(result, expectedOut)
  })

  test('should be unchanged if the add var is empty (empty list)', () => {
    const result =
      shell.exec(`set -e; source src/data/lists.func.sh; LIST=''; list-add-item LIST "$NEW_ITEM"; echo -e "$LIST"`, execOpts)
    const expectedOut = expect.stringMatching(/^\n$/)
    assertMatchNoError(result, expectedOut)
  })

  test(`should build a string usable by 'for'`, () => {
    const result =
      shell.exec(`set -e; source src/data/lists.func.sh; list-add-item LIST foo; list-add-item LIST bar; for i in $LIST; do echo $i; done`, execOpts)
    const expectedOut = expect.stringMatching(/^foo\nbar\n$/)
    assertMatchNoError(result, expectedOut)
  })
})

describe('list-rm-item', () => {
  test('properly removes a single item at the head of a list', () => {
    const result =
      shell.exec(`set -e; source src/data/lists.func.sh; LIST=hey$'\n'ho; list-rm-item LIST 'hey'; echo "$LIST"`, execOpts)
    const expectedOut = expect.stringMatching(/^ho\n$/)
    assertMatchNoError(result, expectedOut)
  })

  test('properly removes a single item at the end of a list', () => {
    const result =
      shell.exec(`set -e; source src/data/lists.func.sh; LIST=hey$'\n'ho; list-rm-item LIST 'ho'; echo "$LIST"`, execOpts)
    const expectedOut = expect.stringMatching(/^hey\n$/)
    assertMatchNoError(result, expectedOut)
  })

  test('properly removes a single item in the middle of a list', () => {
    const result =
      shell.exec(`set -e; source src/data/lists.func.sh; LIST=foo$'\n'bar'\n'baz; list-rm-item LIST 'bar'; echo "$LIST"`, execOpts)
    const expectedOut = expect.stringMatching(/^foo\nbaz\n$/)
    assertMatchNoError(result, expectedOut)
  })

  test('properly final item in a list', () => {
    const result =
      shell.exec(`set -e; source src/data/lists.func.sh; LIST=hey; list-rm-item LIST 'hey'; echo "$LIST"`, execOpts)
    const expectedOut = expect.stringMatching(/^\n$/)
    assertMatchNoError(result, expectedOut)
  })

  test.each`
  char | desc| testEntry
  ${`@`} | ${`in the middle`} | ${`foo@bar`}
  ${`@`} | ${`at front`} | ${`@foobar`}
  ${`/`} | ${`in the middle`} | ${`foo/bar`}
  ${`/`} | ${`at front`} | ${`/foobar`}
  ${`#`} | ${`in the middle`} | ${`foo#bar`}
  ${`#`} | ${`at front`} | ${`#foobar`}
  ${`.`} | ${`in the middle`} | ${`.ar`}
  ${`.`} | ${`at front`} | ${`b.r`}
  ${`[`} | ${`in the middle`} | ${`b[a]r`}
  ${`[`} | ${`at front`} | ${`[f]oo`}
  `(`deals with special character '$char' $desc`, ({testEntry}) => {
    const result =
      shell.exec(`set -e; source src/data/lists.func.sh; LIST=foo$'\n'"${testEntry}"$'\n'bar; list-rm-item LIST "${testEntry}"; echo "$LIST"`, execOpts)
    const expectedOut = expect.stringMatching(/^foo\nbar\n$/)
    assertMatchNoError(result, expectedOut)
  })
})

describe('list-replace-by-string', () => {
  test('should replace every instance in a list', () => {
    const result =
      shell.exec(`set -e; source src/data/lists.func.sh; LIST=foo$'\n'bar$'\n'foo; list-replace-by-string LIST foo baz; echo "$LIST"`, execOpts)
    const expectedOut = expect.stringMatching(/^baz\nbar\nbaz\n$/)
    assertMatchNoError(result, expectedOut)
  })

  test('should not relpace sub-string matches', () => {
    const result =
      shell.exec(`set -e; source src/data/lists.func.sh; LIST=foo$'\n'bar$'\n'foo; list-replace-by-string LIST oo baz; echo "$LIST"`, execOpts)
    const expectedOut = expect.stringMatching(/^foo\nbar\nfoo\n$/)
    assertMatchNoError(result, expectedOut)
  })
})

describe('list-from-csv', () =>{
  test('should create a good list from one item', () => {
    const result =
      shell.exec(`set -e; source src/data/lists.func.sh; list-from-csv LIST foo; echo "$LIST"`, execOpts)
    const expectedOut = expect.stringMatching(/^foo\n$/)
    assertMatchNoError(result, expectedOut)
  })

  test('should create a good list from multiple items', () => {
    const result =
      shell.exec(`set -e; source src/data/lists.func.sh; list-from-csv LIST foo,bar; echo "$LIST"`, execOpts)
    const expectedOut = expect.stringMatching(/^foo\nbar\n$/)
    assertMatchNoError(result, expectedOut)
  })
})

test('list-get-index should echo index of item if present', () => {
  const result =
    shell.exec(`set -e; source src/data/lists.func.sh; LIST=hey$'\n'ho; list-get-index LIST ho`, execOpts)
  const expectedOut = expect.stringMatching(/^1\n$/)
  assertMatchNoError(result, expectedOut)
})

test('list-get-index should echo "" if item not present', () => {
  const result =
    shell.exec(`set -e; source src/data/lists.func.sh; LIST=hey$'\n'there; list-get-index LIST flaw`, execOpts)
  const expectedOut = expect.stringMatching(/^$/)
  assertMatchNoError(result, expectedOut)
})

test('list-get-item should echo the item at the given index, with no space', () => {
  const result =
    shell.exec(`set -e; source src/data/lists.func.sh; LIST=hey$'\n'ho; list-get-item LIST 1`, execOpts)
  const expectedOut = expect.stringMatching(/^ho$/)
  assertMatchNoError(result, expectedOut)
})

test('list-get-item should handle spaces in items', () => {
  const result =
    shell.exec(`set -e; source src/data/lists.func.sh; LIST=billy$'\n''hey there'; list-get-item LIST 1 '\n'`, execOpts)
  const expectedOut = expect.stringMatching(/^hey there$/)
  assertMatchNoError(result, expectedOut)
})

test('list-get-item out of bounds request should echo ""', () => {
  const result =
    shell.exec(`set -e; source src/data/lists.func.sh; LIST=billy$'\n''hey there'; list-get-item LIST 80 '\n'`, execOpts)
  const expectedOut = expect.stringMatching(/^$/)
  assertMatchNoError(result, expectedOut)
})
