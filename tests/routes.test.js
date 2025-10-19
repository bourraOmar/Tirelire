const assert = require('node:assert');
const Module = require('module');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// ----- Third-party stubs --------------------------------------------------
const faceApiMock = {
    env: {
        monkeyPatch: () => {},
    },
    nets: {
        ssdMobilenetv1: { loadFromDisk: async () => {} },
        faceLandmark68Net: { loadFromDisk: async () => {} },
        faceRecognitionNet: { loadFromDisk: async () => {} },
    },
    detectSingleFace: () => ({
        withFaceLandmarks: () => ({
            withFaceDescriptor: async () => null,
        }),
    }),
    euclideanDistance: () => 1,
};

const canvasMock = {
    Canvas: class {},
    Image: class {},
    ImageData: class {},
    loadImage: async () => ({}),
};

const stripeMock = secretKey => {
    if (!secretKey) {
        throw new Error('Stripe secret key missing');
    }

    return {
        paymentIntents: {
            create: async () => ({ id: 'pi_mock', client_secret: 'secret_mock', status: 'requires_payment_method' }),
            retrieve: async id => ({ id, status: 'succeeded' }),
            cancel: async () => ({}),
        },
    };
};

const originalRequire = Module.prototype.require;
Module.prototype.require = function patchedRequire(request) {
    if (request === 'face-api.js') {
        return faceApiMock;
    }
    if (request === 'canvas') {
        return canvasMock;
    }
    if (request === 'stripe') {
        return stripeMock;
    }
    return originalRequire.call(this, request);
};

// ----- Simple test harness -------------------------------------------------
const tests = [];

const test = (name, fn) => {
    tests.push({ name, fn });
};

const run = async () => {
    let failed = 0;
    for (const { name, fn } of tests) {
        try {
            await fn();
            console.log(`✓ ${name}`);
        } catch (error) {
            failed += 1;
            console.error(`✗ ${name}`);
            console.error(error instanceof Error ? error.stack : error);
        }
    }

    if (failed > 0) {
        console.error(`\n${failed} test(s) failed.`);
        process.exitCode = 1;
    } else {
        console.log('\nAll tests passed.');
    }
};

// ----- Helpers -------------------------------------------------------------
const extractRoutes = router =>
    router.stack
        .filter(layer => layer.route)
        .map(layer => ({
            path: layer.route.path,
            methods: Object.keys(layer.route.methods).filter(Boolean),
        }));

const createMockRes = () => {
    const res = {
        statusCode: 200,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };

    return res;
};

const withStub = async (object, key, implementation, fn) => {
    const original = object[key];
    object[key] = implementation;
    try {
        await fn();
    } finally {
        object[key] = original;
    }
};

// ----- Controller happy-path tests (with stubbed services) ----------------

test('authController register returns success payload', async () => {
    const authService = require('../src/services/AuthService');
    const authController = require('../src/controllers/AuthController');
    const fakeUser = { id: 'user123', username: 'john', email: 'john@example.com' };

    await withStub(authService, 'registerUser', async data => {
        assert.deepStrictEqual(data, { username: 'john', email: 'john@example.com', password: 'secret' });
        return fakeUser;
    }, async () => {
        const req = { body: { username: 'john', email: 'john@example.com', password: 'secret' } };
        const res = createMockRes();
        await authController.register(req, res);
        assert.strictEqual(res.statusCode, 201);
        assert.deepStrictEqual(res.body, { message: 'User registered successfully', user: fakeUser });
    });
});//done

test('authController login returns token and user', async () => {
    const authService = require('../src/services/AuthService');
    const authController = require('../src/controllers/AuthController');
    const fakePayload = { token: 'token123', user: { id: 'user123' } };

    await withStub(authService, 'loginUser', async data => {
        assert.deepStrictEqual(data, { email: 'john@example.com', password: 'secret' });
        return fakePayload;
    }, async () => {
        const req = { body: { email: 'john@example.com', password: 'secret' } };
        const res = createMockRes();
        await authController.login(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Login successful', ...fakePayload });
    });
});//done

test('authController getProfile returns user profile', async () => {
    const authService = require('../src/services/AuthService');
    const authController = require('../src/controllers/AuthController');
    const fakeUser = { id: 'user123', username: 'john' };

    await withStub(authService, 'getUserProfile', async userId => {
        assert.strictEqual(userId, 'user123');
        return fakeUser;
    }, async () => {
        const req = { user: { id: 'user123' } };
        const res = createMockRes();
        await authController.getProfile(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { user: fakeUser });
    });
});//done

test('authController updateProfile returns updated user', async () => {
    const authService = require('../src/services/AuthService');
    const authController = require('../src/controllers/AuthController');
    const fakeUser = { id: 'user123', username: 'updated' };

    await withStub(authService, 'updateUserProfile', async (userId, body) => {
        assert.strictEqual(userId, 'user123');
        assert.deepStrictEqual(body, { username: 'updated' });
        return fakeUser;
    }, async () => {
        const req = { user: { id: 'user123' }, body: { username: 'updated' } };
        const res = createMockRes();
        await authController.updateProfile(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Profile updated successfully', user: fakeUser });
    });
});//done

test('groupController createGroup delegates to service', async () => {
    const groupService = require('../src/services/GroupService');
    const groupController = require('../src/controllers/GroupController');
    const fakeGroup = { id: 'group1', name: 'My Group' };

    await withStub(groupService, 'createGroup', async (ownerId, payload) => {
        assert.strictEqual(ownerId, 'user123');
        assert.deepStrictEqual(payload, { name: 'My Group' });
        return fakeGroup;
    }, async () => {
        const req = { user: { id: 'user123' }, body: { name: 'My Group' } };
        const res = createMockRes();
        await groupController.createGroup(req, res);
        assert.strictEqual(res.statusCode, 201);
        assert.deepStrictEqual(res.body, { message: 'Group created successfully', group: fakeGroup });
    });
});//done

test('messageController createMessage returns success', async () => {
    const messageService = require('../src/services/MessageService');
    const messageController = require('../src/controllers/MessageController');
    const fakeMessage = { id: 'msg1', content: 'Hello' };

    await withStub(messageService, 'createGroupMessage', async (groupId, senderId, payload) => {
        assert.strictEqual(groupId, 'group1');
        assert.strictEqual(senderId, 'user123');
        assert.deepStrictEqual(payload, { content: 'Hello' });
        return fakeMessage;
    }, async () => {
        const req = { params: { groupId: 'group1' }, user: { id: 'user123' }, body: { content: 'Hello' } };
        const res = createMockRes();
        await messageController.createMessage(req, res);
        assert.strictEqual(res.statusCode, 201);
        assert.deepStrictEqual(res.body, { message: 'Message sent successfully', data: fakeMessage });
    });
});//done

test('paymentController createPaymentIntent returns client secret', async () => {
    const paymentService = require('../src/services/PaymentService');
    const paymentController = require('../src/controllers/PaymentController');
    const fakeResult = { payment: { id: 'pay1' }, clientSecret: 'secret' };

    await withStub(paymentService, 'createPaymentIntent', async (userId, payload) => {
        assert.strictEqual(userId, 'user123');
        assert.deepStrictEqual(payload, { amount: 100, currency: 'MAD', method: 'credit_card' });
        return fakeResult;
    }, async () => {
        const req = { user: { id: 'user123' }, body: { amount: 100, currency: 'MAD', method: 'credit_card' } };
        const res = createMockRes();
        await paymentController.createPaymentIntent(req, res);
        assert.strictEqual(res.statusCode, 201);
        assert.deepStrictEqual(res.body, { message: 'Payment intent created', ...fakeResult });
    });
});//done

test('kycController submitKYC returns created record', async () => {
    const kycService = require('../src/services/KycService');
    const kycController = require('../src/controllers/KycController');
    const fakeKyc = { id: 'kyc1', user: 'user123' };

    await withStub(kycService, 'submitKYC', async (userId, payload) => {
        assert.strictEqual(userId, 'user123');
        assert.deepStrictEqual(payload, { firstName: 'John' });
        return fakeKyc;
    }, async () => {
        const req = { user: { id: 'user123' }, body: { firstName: 'John' } };
        const res = createMockRes();
        await kycController.submitKYC(req, res);
        assert.strictEqual(res.statusCode, 201);
        assert.deepStrictEqual(res.body, { message: 'KYC submitted successfully', kyc: fakeKyc });
    });
});//done

test('reliabilityController getMyReliability returns record', async () => {
    const reliabilityService = require('../src/services/ReliabilityService');
    const reliabilityController = require('../src/controllers/ReliabilityController');
    const fakeReliability = { score: 80 };

    await withStub(reliabilityService, 'getReliabilityForUser', async userId => {
        assert.strictEqual(userId, 'user123');
        return fakeReliability;
    }, async () => {
        const req = { user: { id: 'user123', role: 'user' } };
        const res = createMockRes();
        await reliabilityController.getMyReliability(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { reliability: fakeReliability });
    });
});//done

test('turnController scheduleTurn returns turn data', async () => {
    const turnService = require('../src/services/TurnService');
    const turnController = require('../src/controllers/TurnController');
    const fakeTurn = { id: 'turn1', month: 1 };

    await withStub(turnService, 'scheduleTurn', async params => {
        assert.deepStrictEqual(params, {
            groupId: 'group1',
            memberId: 'member1',
            month: 1,
            year: 2025,
            requesterId: 'user123',
        });
        return fakeTurn;
    }, async () => {
        const req = {
            params: { groupId: 'group1' },
            body: { memberId: 'member1', month: 1, year: 2025 },
            user: { id: 'user123' },
        };
        const res = createMockRes();
        await turnController.scheduleTurn(req, res);
        assert.strictEqual(res.statusCode, 201);
        assert.deepStrictEqual(res.body, { message: 'Turn scheduled successfully', turn: fakeTurn });
    });
});//done

test('ticketController createTicket returns ticket data', async () => {
    const ticketService = require('../src/services/TicketService');
    const ticketController = require('../src/controllers/TicketController');
    const fakeTicket = { id: 'ticket1', subject: 'Help' };

    await withStub(ticketService, 'createTicket', async params => {
        assert.deepStrictEqual(params, {
            userId: 'user123',
            subject: 'Help',
            description: 'Need assistance',
            priority: 'high',
        });
        return fakeTicket;
    }, async () => {
        const req = {
            body: { subject: 'Help', description: 'Need assistance', priority: 'high' },
            user: { id: 'user123', role: 'user' },
        };
        const res = createMockRes();
        await ticketController.createTicket(req, res);
        assert.strictEqual(res.statusCode, 201);
        assert.deepStrictEqual(res.body, { message: 'Ticket created successfully', ticket: fakeTicket });
    });
});//done

test('authController getUserInfo returns user details', async () => {
    const authService = require('../src/services/AuthService');
    const authController = require('../src/controllers/AuthController');
    const fakeUser = { id: 'user123', email: 'john@example.com' };

    await withStub(authService, 'getUserInfo', async userId => {
        assert.strictEqual(userId, 'user123');
        return fakeUser;
    }, async () => {
        const req = { user: { id: 'user123' } };
        const res = createMockRes();
        await authController.getUserInfo(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { user: fakeUser });
    });
});//done

test('groupController handles list, fetch, update, delete, and membership', async () => {
    const groupService = require('../src/services/GroupService');
    const groupController = require('../src/controllers/GroupController');

    await withStub(groupService, 'getGroupsForUser', async userId => {
        assert.strictEqual(userId, 'user123');
        return [{ id: 'group1' }];
    }, async () => {
        const req = { user: { id: 'user123' } };
        const res = createMockRes();
        await groupController.getMyGroups(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { groups: [{ id: 'group1' }] });
    });

    await withStub(groupService, 'getGroupById', async (groupId, userId) => {
        assert.strictEqual(groupId, 'group1');
        assert.strictEqual(userId, 'user123');
        return { id: 'group1' };
    }, async () => {
        const req = { params: { groupId: 'group1' }, user: { id: 'user123' } };
        const res = createMockRes();
        await groupController.getGroupById(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { group: { id: 'group1' } });
    });

    await withStub(groupService, 'updateGroup', async (groupId, userId, payload) => {
        assert.strictEqual(groupId, 'group1');
        assert.strictEqual(userId, 'user123');
        assert.deepStrictEqual(payload, { name: 'Updated' });
        return { id: 'group1', name: 'Updated' };
    }, async () => {
        const req = { params: { groupId: 'group1' }, user: { id: 'user123' }, body: { name: 'Updated' } };
        const res = createMockRes();
        await groupController.updateGroup(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Group updated successfully', group: { id: 'group1', name: 'Updated' } });
    });

    await withStub(groupService, 'deleteGroup', async (groupId, userId) => {
        assert.strictEqual(groupId, 'group1');
        assert.strictEqual(userId, 'user123');
        return { success: true };
    }, async () => {
        const req = { params: { groupId: 'group1' }, user: { id: 'user123' } };
        const res = createMockRes();
        await groupController.deleteGroup(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Group deleted successfully' });
    });

    await withStub(groupService, 'addMember', async (groupId, requesterId, memberId) => {
        assert.strictEqual(groupId, 'group1');
        assert.strictEqual(requesterId, 'user123');
        assert.strictEqual(memberId, 'member1');
        return { id: 'group1', members: ['member1'] };
    }, async () => {
        const req = {
            params: { groupId: 'group1' },
            user: { id: 'user123' },
            body: { userId: 'member1' },
        };
        const res = createMockRes();
        await groupController.addMember(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Member added successfully', group: { id: 'group1', members: ['member1'] } });
    });

    await withStub(groupService, 'removeMember', async (groupId, requesterId, memberId) => {
        assert.strictEqual(groupId, 'group1');
        assert.strictEqual(requesterId, 'user123');
        assert.strictEqual(memberId, 'member1');
        return { id: 'group1', members: [] };
    }, async () => {
        const req = {
            params: { groupId: 'group1', memberId: 'member1' },
            user: { id: 'user123' },
        };
        const res = createMockRes();
        await groupController.removeMember(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Member removed successfully', group: { id: 'group1', members: [] } });
    });
});//done

test('messageController supports listing, marking, and deleting', async () => {
    const messageService = require('../src/services/MessageService');
    const messageController = require('../src/controllers/MessageController');

    await withStub(messageService, 'getMessagesForGroup', async (groupId, userId) => {
        assert.strictEqual(groupId, 'group1');
        assert.strictEqual(userId, 'user123');
        return [{ id: 'msg1' }];
    }, async () => {
        const req = { params: { groupId: 'group1' }, user: { id: 'user123' } };
        const res = createMockRes();
        await messageController.getGroupMessages(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { messages: [{ id: 'msg1' }] });
    });

    await withStub(messageService, 'markMessageAsRead', async (messageId, userId) => {
        assert.strictEqual(messageId, 'msg1');
        assert.strictEqual(userId, 'user123');
        return { id: 'msg1', isRead: true };
    }, async () => {
        const req = { params: { messageId: 'msg1' }, user: { id: 'user123' } };
        const res = createMockRes();
        await messageController.markAsRead(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Message marked as read', data: { id: 'msg1', isRead: true } });
    });

    await withStub(messageService, 'deleteMessage', async (messageId, userId) => {
        assert.strictEqual(messageId, 'msg1');
        assert.strictEqual(userId, 'user123');
        return { success: true };
    }, async () => {
        const req = { params: { messageId: 'msg1' }, user: { id: 'user123' } };
        const res = createMockRes();
        await messageController.deleteMessage(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Message deleted successfully' });
    });
});//done

test('paymentController syncs, lists, retrieves, and cancels payments', async () => {
    const paymentService = require('../src/services/PaymentService');
    const paymentController = require('../src/controllers/PaymentController');

    await withStub(paymentService, 'syncPaymentIntent', async ({ paymentIntentId, userId }) => {
        assert.strictEqual(paymentIntentId, 'pi_123');
        assert.strictEqual(userId, 'user123');
        return { id: 'pay1', status: 'completed' };
    }, async () => {
        const req = { params: { paymentIntentId: 'pi_123' }, user: { id: 'user123' } };
        const res = createMockRes();
        await paymentController.syncPayment(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Payment status updated', payment: { id: 'pay1', status: 'completed' } });
    });

    await withStub(paymentService, 'listPaymentsForUser', async userId => {
        assert.strictEqual(userId, 'user123');
        return [{ id: 'pay1' }];
    }, async () => {
        const req = { user: { id: 'user123' } };
        const res = createMockRes();
        await paymentController.getMyPayments(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { payments: [{ id: 'pay1' }] });
    });

    await withStub(paymentService, 'getPaymentById', async ({ paymentId, userId }) => {
        assert.strictEqual(paymentId, 'pay1');
        assert.strictEqual(userId, 'user123');
        return { id: 'pay1' };
    }, async () => {
        const req = { params: { paymentId: 'pay1' }, user: { id: 'user123' } };
        const res = createMockRes();
        await paymentController.getPaymentById(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { payment: { id: 'pay1' } });
    });

    await withStub(paymentService, 'cancelPaymentIntent', async ({ paymentId, userId }) => {
        assert.strictEqual(paymentId, 'pay1');
        assert.strictEqual(userId, 'user123');
        return { id: 'pay1', status: 'failed' };
    }, async () => {
        const req = { params: { paymentId: 'pay1' }, user: { id: 'user123' } };
        const res = createMockRes();
        await paymentController.cancelPayment(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Payment canceled', payment: { id: 'pay1', status: 'failed' } });
    });
});//done

test('kycController fetches and verifies data', async () => {
    const kycService = require('../src/services/KycService');
    const kycController = require('../src/controllers/KycController');

    await withStub(kycService, 'getMyKYC', async userId => {
        assert.strictEqual(userId, 'user123');
        return { id: 'kyc1' };
    }, async () => {
        const req = { user: { id: 'user123' } };
        const res = createMockRes();
        await kycController.getMyKYC(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { kyc: { id: 'kyc1' } });
    });

    await withStub(kycService, 'verifyKYCByAI', async (kycId, payload) => {
        assert.strictEqual(kycId, 'kyc1');
        assert.deepStrictEqual(payload, { idCardImage: 'data', selfieImage: 'data2' });
        return { id: 'kyc1', isVerByAI: true };
    }, async () => {
        const req = { params: { id: 'kyc1' }, user: { id: 'user123' }, body: { idCardImage: 'data', selfieImage: 'data2' } };
        const res = createMockRes();
        await kycController.verifyKYCByAI(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'KYC AI verification updated', kyc: { id: 'kyc1', isVerByAI: true } });
    });

    await withStub(kycService, 'getKycById', async kycId => {
        assert.strictEqual(kycId, 'kyc1');
        return { id: 'kyc1' };
    }, async () => {
        const req = { params: { id: 'kyc1' }, user: { id: 'user123' } };
        const res = createMockRes();
        await kycController.getKycById(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { kyc: { id: 'kyc1' } });
    });
});//done

test('reliabilityController updates, records, and lists leaderboard', async () => {
    const reliabilityService = require('../src/services/ReliabilityService');
    const reliabilityController = require('../src/controllers/ReliabilityController');

    await withStub(reliabilityService, 'updateReliability', async (userId, payload) => {
        assert.strictEqual(userId, 'user123');
        assert.deepStrictEqual(payload, { score: 90 });
        return { score: 90 };
    }, async () => {
        const req = { user: { id: 'user123', role: 'user' }, body: { score: 90 } };
        const res = createMockRes();
        await reliabilityController.updateMyReliability(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Reliability updated successfully', reliability: { score: 90 } });
    });

    await withStub(reliabilityService, 'recordPaymentEvent', async payload => {
        assert.deepStrictEqual(payload, { userId: 'user123', type: 'on_time_payment', amount: 100 });
        return { score: 95 };
    }, async () => {
        const req = { user: { id: 'user123', role: 'user' }, body: { type: 'on_time_payment', amount: 100 } };
        const res = createMockRes();
        await reliabilityController.recordEvent(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Reliability event recorded', reliability: { score: 95 } });
    });

    await withStub(reliabilityService, 'getTopReliableUsers', async ({ limit }) => {
        assert.strictEqual(limit, 5);
        return [{ user: 'user123', score: 95 }];
    }, async () => {
        const req = { user: { id: 'admin1', role: 'admin' }, query: { limit: '5' } };
        const res = createMockRes();
        await reliabilityController.getTopReliableUsers(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { users: [{ user: 'user123', score: 95 }] });
    });
});//done

test('turnController lists, completes, and deletes turns', async () => {
    const turnService = require('../src/services/TurnService');
    const turnController = require('../src/controllers/TurnController');

    await withStub(turnService, 'listTurnsForGroup', async params => {
        assert.deepStrictEqual(params, { groupId: 'group1', requesterId: 'user123' });
        return [{ id: 'turn1' }];
    }, async () => {
        const req = { params: { groupId: 'group1' }, user: { id: 'user123' } };
        const res = createMockRes();
        await turnController.listTurns(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { turns: [{ id: 'turn1' }] });
    });

    await withStub(turnService, 'markTurnCompleted', async params => {
        assert.deepStrictEqual(params, { turnId: 'turn1', requesterId: 'user123', totalReceived: 500 });
        return { id: 'turn1', isCompleted: true };
    }, async () => {
        const req = { params: { turnId: 'turn1' }, user: { id: 'user123' }, body: { totalReceived: 500 } };
        const res = createMockRes();
        await turnController.markTurnCompleted(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Turn marked as completed', turn: { id: 'turn1', isCompleted: true } });
    });

    await withStub(turnService, 'deleteTurn', async params => {
        assert.deepStrictEqual(params, { turnId: 'turn1', requesterId: 'user123' });
        return { success: true };
    }, async () => {
        const req = { params: { turnId: 'turn1' }, user: { id: 'user123' } };
        const res = createMockRes();
        await turnController.deleteTurn(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Turn deleted successfully' });
    });
});//done

test('ticketController listing, retrieval, responses, and status updates succeed', async () => {
    const ticketService = require('../src/services/TicketService');
    const ticketController = require('../src/controllers/TicketController');

    await withStub(ticketService, 'listTickets', async params => {
        assert.deepStrictEqual(params, { userId: 'user123', role: 'user', status: undefined });
        return [{ id: 'ticket1' }];
    }, async () => {
        const req = { user: { id: 'user123', role: 'user' }, query: {} };
        const res = createMockRes();
        await ticketController.listTickets(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { tickets: [{ id: 'ticket1' }] });
    });

    await withStub(ticketService, 'getTicketById', async params => {
        assert.deepStrictEqual(params, { ticketId: 'ticket1', userId: 'user123', role: 'user' });
        return { id: 'ticket1' };
    }, async () => {
        const req = { params: { ticketId: 'ticket1' }, user: { id: 'user123', role: 'user' } };
        const res = createMockRes();
        await ticketController.getTicket(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { ticket: { id: 'ticket1' } });
    });

    await withStub(ticketService, 'addTicketResponse', async params => {
        assert.deepStrictEqual(params, { ticketId: 'ticket1', userId: 'user123', role: 'user', message: 'Thanks' });
        return { id: 'ticket1', responses: [{ message: 'Thanks' }] };
    }, async () => {
        const req = { params: { ticketId: 'ticket1' }, user: { id: 'user123', role: 'user' }, body: { message: 'Thanks' } };
        const res = createMockRes();
        await ticketController.addResponse(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Response added successfully', ticket: { id: 'ticket1', responses: [{ message: 'Thanks' }] } });
    });

    await withStub(ticketService, 'updateTicketStatus', async params => {
        assert.deepStrictEqual(params, { ticketId: 'ticket1', userId: 'admin1', role: 'admin', status: 'resolved' });
        return { id: 'ticket1', status: 'resolved' };
    }, async () => {
        const req = { params: { ticketId: 'ticket1' }, user: { id: 'admin1', role: 'admin' }, body: { status: 'resolved' } };
        const res = createMockRes();
        await ticketController.updateStatus(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(res.body, { message: 'Ticket status updated', ticket: { id: 'ticket1', status: 'resolved' } });
    });
});//done



//run tests
run();