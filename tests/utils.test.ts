import { describe, it, expect } from 'vitest';
import { serializeJsonLd } from '../src/lib/utils';

describe('serializeJsonLd', () => {
  it('escapes < so a title cannot close the script element', () => {
    const out = serializeJsonLd({ headline: 'Why I hate </script> tags' });
    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003c/script>');
  });

  it('produces JSON that parses back to the original value', () => {
    const data = { headline: 'a </script> b', name: '<b>x</b>' };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it('leaves ordinary values byte-identical to JSON.stringify', () => {
    const data = { '@type': 'Article', headline: 'Nuggets of Wisdom’s' };
    expect(serializeJsonLd(data)).toBe(JSON.stringify(data));
  });
});
