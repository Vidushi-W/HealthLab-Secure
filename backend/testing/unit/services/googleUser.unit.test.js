const { findOrCreateGoogleUser } = require('../../../src/services/googleUser');

function userDoc(fields) {
  return {
    ...fields,
    save: jest.fn(async function save() { return this; }),
  };
}

test('logs in an existing user matched by google_id', async () => {
  const existing = userDoc({ _id: '1', email: 'a@example.com', google_id: 'sub-1', role: 'participant' });
  const User = { findOne: jest.fn(async () => existing), create: jest.fn() };
  const user = await findOrCreateGoogleUser(User, { sub: 'sub-1', email: 'a@example.com', email_verified: true, name: 'A' });
  expect(user).toBe(existing);
  expect(User.create).not.toHaveBeenCalled();
  expect(User.findOne).toHaveBeenCalledWith({ google_id: 'sub-1' });
});

test('links google_id when the email already belongs to a local account', async () => {
  const existing = userDoc({ _id: '2', email: 'Person@Example.com', role: 'researcher' });
  const User = {
    findOne: jest.fn(async (query) => (query.google_id ? null : existing)),
    create: jest.fn(),
  };
  const user = await findOrCreateGoogleUser(User, { sub: 'sub-2', email: 'person@example.com', name: 'Person' });
  expect(user.google_id).toBe('sub-2');
  expect(existing.save).toHaveBeenCalled();
  expect(User.create).not.toHaveBeenCalled();
});

test('registers a participant when neither google_id nor email exists', async () => {
  const created = userDoc({ _id: '3', role: 'participant' });
  const User = { findOne: jest.fn(async () => null), create: jest.fn(async () => created) };
  const user = await findOrCreateGoogleUser(User, { sub: 'sub-3', email: 'New.User@Example.com', name: 'New User' });
  expect(user).toBe(created);
  expect(User.create).toHaveBeenCalledWith({
    name: 'New User',
    email: 'new.user@example.com',
    google_id: 'sub-3',
    role: 'participant',
  });
});

test('refuses to replace a google_id already linked to that email', async () => {
  const existing = userDoc({ _id: '4', email: 'a@example.com', google_id: 'other-sub' });
  const User = {
    findOne: jest.fn(async (query) => (query.google_id ? null : existing)),
    create: jest.fn(),
  };
  await expect(findOrCreateGoogleUser(User, { sub: 'sub-4', email: 'a@example.com', name: 'A' }))
    .rejects.toMatchObject({ status: 409 });
  expect(existing.save).not.toHaveBeenCalled();
});
