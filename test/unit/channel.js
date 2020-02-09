import { getChannel } from '../../src/channel';

describe('channel.get', () => {
  it('should get the default channel', () => {
    expect(getChannel(undefined)).toBe('latest');
  });

  it('should get the passed channel if valid', async () => {
    expect(getChannel('next')).toBe('next');
  });

  it('should prefix channel with "release-" if invalid', () => {
    expect(getChannel('1.x')).toBe('release-1.x');
  });
});
