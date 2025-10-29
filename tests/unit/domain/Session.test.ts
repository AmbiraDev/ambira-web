import { Session } from '@/domain/entities/Session';

function createSession() {
  return new Session(
    'session-1',
    'user-1',
    'project-1',
    'activity-1',
    5400,
    new Date('2024-01-01T10:00:00Z'),
    'Deep Work',
    'Wrote documentation',
    'everyone',
    3,
    2,
    ['group-1'],
    undefined,
    undefined,
    undefined,
    ['https://example.com/img.png'],
    true,
    ['user-2'],
    true,
    new Date('2024-01-01T11:30:00Z'),
    ['writing'],
    true,
    'energized',
    'notes',
    false
  );
}

describe('domain/entities/Session', () => {
  it('computes human readable durations', () => {
    const session = createSession();

    expect(session.getDurationInHours()).toBeCloseTo(1.5);
    expect(session.getDurationInMinutes()).toBe(90);
    expect(session.getFormattedDuration()).toBe('1h 30m');
  });

  it.each`
    visibility     | viewerId    | isFollower | expected
    ${'everyone'}  | ${'other'}  | ${false}   | ${true}
    ${'followers'} | ${'other'}  | ${true}    | ${true}
    ${'followers'} | ${'other'}  | ${false}   | ${false}
    ${'private'}   | ${'other'}  | ${true}    | ${false}
    ${'private'}   | ${'user-1'} | ${false}   | ${true}
  `(
    'respects privacy guards for $visibility sessions',
    ({ visibility, viewerId, isFollower, expected }) => {
      const session = new Session(
        'id',
        'user-1',
        'project',
        'activity',
        60,
        new Date(),
        undefined,
        undefined,
        visibility as 'everyone'
      );

      expect(session.isVisibleTo(viewerId, isFollower)).toBe(expected);
    }
  );

  it('increments and decrements social counters immutably', () => {
    const original = createSession();

    const withSupport = original.withIncrementedSupport();
    expect(withSupport.supportCount).toBe(original.supportCount + 1);
    expect(withSupport).not.toBe(original);

    const withComments = original.withIncrementedComments();
    expect(withComments.commentCount).toBe(original.commentCount + 1);

    expect(() => {
      new Session(
        's',
        'u',
        'p',
        'a',
        30,
        new Date(),
        undefined,
        undefined,
        'everyone',
        0
      ).withDecrementedSupport();
    }).toThrow('Support count cannot be negative');
  });

  it('serializes core fields with toJSON', () => {
    const session = createSession();
    const json = session.toJSON();

    expect(json).toMatchObject({
      id: 'session-1',
      userId: 'user-1',
      projectId: 'project-1',
      activityId: 'activity-1',
      duration: 5400,
      visibility: 'everyone',
      supportCount: 3,
      commentCount: 2,
    });
    expect(Array.isArray(json.groupIds)).toBe(true);
  });
});
