const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    jid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        index: true
    },
    description: {
        type: String,
        default: ''
    },
    profilePicture: {
        type: String,
        default: null
    },
    participants: {
        type: Number,
        default: 0
    },
    admins: [{
        jid: String,
        role: {
            type: String,
            enum: ['admin', 'superadmin'],
            default: 'admin'
        },
        promotedAt: {
            type: Date,
            default: Date.now
        },
        promotedBy: String
    }],
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    banReason: {
        type: String,
        default: null
    },
    banUntil: {
        type: Date,
        default: null
    },
    bannedBy: {
        type: String,
        default: null
    },
    settings: {
        language: {
            type: String,
            default: 'en'
        },
        timezone: {
            type: String,
            default: 'UTC'
        },
        prefix: {
            type: String,
            default: null
        },
        noPrefixEnabled: {
            type: Boolean,
            default: false
        },
        onlyAdmins: {
            type: Boolean,
            default: false
        },
        welcome: {
            enabled: {
                type: Boolean,
                default: false
            },
            message: {
                type: String,
                default: 'Welcome {user} to {group}! 👋'
            },
            media: {
                type: String,
                default: null
            },
            deleteAfter: {
                type: Number,
                default: 0
            }
        },
        goodbye: {
            enabled: {
                type: Boolean,
                default: false
            },
            message: {
                type: String,
                default: 'Goodbye {user}! 👋'
            },
            media: {
                type: String,
                default: null
            }
        },
        antiLink: {
            enabled: {
                type: Boolean,
                default: false
            },
            action: {
                type: String,
                enum: ['warn', 'kick', 'ban'],
                default: 'warn'
            },
            whitelist: [{
                type: String
            }],
            adminBypass: {
                type: Boolean,
                default: true
            }
        },
        antiSpam: {
            enabled: {
                type: Boolean,
                default: true
            },
            maxMessages: {
                type: Number,
                default: 5
            },
            timeWindow: {
                type: Number,
                default: 10000
            },
            action: {
                type: String,
                enum: ['warn', 'mute', 'kick'],
                default: 'warn'
            }
        },
        antiDelete: {
            enabled: {
                type: Boolean,
                default: false
            },
            adminOnly: {
                type: Boolean,
                default: true
            }
        },
        autoSticker: {
            enabled: {
                type: Boolean,
                default: false
            },
            keywords: [{
                type: String
            }]
        },
        muteAll: {
            type: Boolean,
            default: false
        },
        announceMode: {
            type: Boolean,
            default: false
        },
        restrictMode: {
            type: Boolean,
            default: false
        },
        promoteNotifyEnabled: {
            type: Boolean,
            default: true
        },
        demoteNotifyEnabled: {
            type: Boolean,
            default: true
        }
    },
    economy: {
        enabled: {
            type: Boolean,
            default: false
        },
        leaderboard: {
            type: Boolean,
            default: true
        }
    },
    games: {
        enabled: {
            type: Boolean,
            default: true
        },
        activeGames: [{
            type: String,
            player: String,
            startedAt: Date,
            expiresAt: Date
        }]
    },
    statistics: {
        messageCount: {
            type: Number,
            default: 0
        },
        commandsUsed: {
            type: Number,
            default: 0
        },
        mediaShared: {
            type: Number,
            default: 0
        },
        mentionsCount: {
            type: Number,
            default: 0
        },
        membersJoined: {
            type: Number,
            default: 0
        },
        membersLeft: {
            type: Number,
            default: 0
        },
        lastActivity: {
            type: Date,
            default: Date.now
        }
    },
    warnings: [{
        user: String,
        reason: String,
        warnedBy: String,
        warnedAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: Date
    }],
    mutedUsers: [{
        jid: String,
        mutedBy: String,
        mutedAt: {
            type: Date,
            default: Date.now
        },
        mutedUntil: Date,
        reason: String
    }],
    autoReplies: [{
        trigger: String,
        response: String,
        createdBy: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    customCommands: [{
        name: String,
        response: String,
        createdBy: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    schedule: {
        tasks: [{
            name: String,
            type: {
                type: String,
                enum: ['message', 'reminder', 'cleanup']
            },
            schedule: String,
            data: mongoose.Schema.Types.Mixed,
            enabled: {
                type: Boolean,
                default: true
            },
            lastRun: Date,
            nextRun: Date
        }]
    }
}, {
    timestamps: true,
    versionKey: false
});

GroupSchema.index({ name: 1 });
GroupSchema.index({ participants: -1 });
GroupSchema.index({ isBanned: 1, banUntil: 1 });

GroupSchema.methods.ban = function(reason, duration, bannedBy) {
    this.isBanned = true;
    this.banReason = reason;
    this.bannedBy = bannedBy;
    
    if (duration) {
        this.banUntil = new Date(Date.now() + duration);
    }
    
    return this.save();
};

GroupSchema.methods.unban = function() {
    this.isBanned = false;
    this.banReason = null;
    this.banUntil = null;
    this.bannedBy = null;
    return this.save();
};

GroupSchema.methods.muteUser = function(userJid, duration, reason, mutedBy) {
    const existingMute = this.mutedUsers.find(m => m.jid === userJid);
    
    if (existingMute) {
        existingMute.mutedUntil = new Date(Date.now() + duration);
        existingMute.reason = reason;
    } else {
        this.mutedUsers.push({
            jid: userJid,
            mutedBy,
            mutedUntil: new Date(Date.now() + duration),
            reason
        });
    }
    
    return this.save();
};

GroupSchema.methods.unmuteUser = function(userJid) {
    this.mutedUsers = this.mutedUsers.filter(m => m.jid !== userJid);
    return this.save();
};

GroupSchema.methods.isUserMuted = function(userJid) {
    const mute = this.mutedUsers.find(m => m.jid === userJid);
    
    if (!mute) return false;
    if (mute.mutedUntil && mute.mutedUntil <= Date.now()) {
        this.unmuteUser(userJid);
        return false;
    }
    
    return true;
};

GroupSchema.methods.warnUser = function(userJid, reason, warnedBy, duration = 24 * 60 * 60 * 1000) {
    this.warnings.push({
        user: userJid,
        reason,
        warnedBy,
        expiresAt: new Date(Date.now() + duration)
    });
    
    const userWarnings = this.warnings.filter(w => w.user === userJid).length;
    
    return { warnings: userWarnings, shouldKick: userWarnings >= 3 };
};

GroupSchema.methods.clearUserWarnings = function(userJid) {
    this.warnings = this.warnings.filter(w => w.user !== userJid);
    return this.save();
};

GroupSchema.methods.getUserWarnings = function(userJid) {
    return this.warnings.filter(w => w.user === userJid && (!w.expiresAt || w.expiresAt > Date.now()));
};

GroupSchema.methods.addAutoReply = function(trigger, response, createdBy) {
    const existing = this.autoReplies.find(ar => ar.trigger === trigger);
    
    if (existing) {
        existing.response = response;
        existing.createdBy = createdBy;
    } else {
        this.autoReplies.push({ trigger, response, createdBy });
    }
    
    return this.save();
};

GroupSchema.methods.removeAutoReply = function(trigger) {
    this.autoReplies = this.autoReplies.filter(ar => ar.trigger !== trigger);
    return this.save();
};

GroupSchema.methods.addCustomCommand = function(name, response, createdBy) {
    const existing = this.customCommands.find(cc => cc.name === name);
    
    if (existing) {
        existing.response = response;
        existing.createdBy = createdBy;
    } else {
        this.customCommands.push({ name, response, createdBy });
    }
    
    return this.save();
};

GroupSchema.methods.removeCustomCommand = function(name) {
    this.customCommands = this.customCommands.filter(cc => cc.name !== name);
    return this.save();
};

GroupSchema.methods.updateSetting = function(path, value) {
    this.set(`settings.${path}`, value);
    return this.save();
};

GroupSchema.methods.isAdmin = function(userJid) {
    return this.admins.some(admin => admin.jid === userJid);
};

GroupSchema.methods.promoteUser = function(userJid, promotedBy, role = 'admin') {
    const existing = this.admins.find(admin => admin.jid === userJid);
    
    if (!existing) {
        this.admins.push({
            jid: userJid,
            role,
            promotedBy
        });
    } else {
        existing.role = role;
        existing.promotedBy = promotedBy;
        existing.promotedAt = new Date();
    }
    
    return this.save();
};

GroupSchema.methods.demoteUser = function(userJid) {
    this.admins = this.admins.filter(admin => admin.jid !== userJid);
    return this.save();
};

GroupSchema.pre('save', function(next) {
    if (this.banUntil && this.banUntil <= Date.now()) {
        this.isBanned = false;
        this.banReason = null;
        this.banUntil = null;
        this.bannedBy = null;
    }
    
    this.warnings = this.warnings.filter(w => !w.expiresAt || w.expiresAt > Date.now());
    this.mutedUsers = this.mutedUsers.filter(m => !m.mutedUntil || m.mutedUntil > Date.now());
    
    next();
});

const Group = mongoose.model('Group', GroupSchema);

async function getGroup(jid) {
    try {
        return await Group.findOne({ jid });
    } catch (error) {
        throw error;
    }
}

async function createGroup(groupData) {
    try {
        const group = new Group(groupData);
        return await group.save();
    } catch (error) {
        throw error;
    }
}

async function updateGroup(jid, updateData) {
    try {
        return await Group.findOneAndUpdate({ jid }, updateData, { new: true, upsert: true });
    } catch (error) {
        throw error;
    }
}

async function deleteGroup(jid) {
    try {
        return await Group.findOneAndDelete({ jid });
    } catch (error) {
        throw error;
    }
}

async function getGroupStats() {
    try {
        const total = await Group.countDocuments();
        const banned = await Group.countDocuments({ isBanned: true });
        const withWelcome = await Group.countDocuments({ 'settings.welcome.enabled': true });
        const withAntiLink = await Group.countDocuments({ 'settings.antiLink.enabled': true });

async function getGroupStats() {
    try {
        const total = await Group.countDocuments();
        const banned = await Group.countDocuments({ isBanned: true });
        const withWelcome = await Group.countDocuments({ 'settings.welcome.enabled': true });
        const withAntiLink = await Group.countDocuments({ 'settings.antiLink.enabled': true });
        const active = await Group.countDocuments({
            'statistics.lastActivity': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        return { total, banned, withWelcome, withAntiLink, active };
    } catch (error) {
        throw error;
    }
}

async function getTopGroups(field = 'statistics.messageCount', limit = 10) {
    try {
        const sortObj = {};
        sortObj[field] = -1;
        return await Group.find({ isBanned: false }).sort(sortObj).limit(limit);
    } catch (error) {
        throw error;
    }
}

async function searchGroups(query, options = {}) {
    try {
        const searchRegex = new RegExp(query, 'i');
        const searchQuery = {
            $and: [
                { isBanned: false },
                {
                    $or: [
                        { name: searchRegex },
                        { description: searchRegex }
                    ]
                }
            ]
        };

        if (options.minParticipants) {
            searchQuery.$and.push({ participants: { $gte: options.minParticipants } });
        }

        if (options.maxParticipants) {
            searchQuery.$and.push({ participants: { $lte: options.maxParticipants } });
        }

        return await Group.find(searchQuery).limit(options.limit || 20);
    } catch (error) {
        throw error;
    }
}

async function cleanupExpiredData() {
    try {
        const result = await Group.updateMany(
            {},
            {
                $pull: {
                    warnings: { expiresAt: { $lte: new Date() } },
                    mutedUsers: { mutedUntil: { $lte: new Date() } }
                }
            }
        );

        return result;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    Group,
    getGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupStats,
    getTopGroups,
    searchGroups,
    cleanupExpiredData
};