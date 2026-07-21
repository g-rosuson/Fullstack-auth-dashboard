const status = {
    schedule: {
        idle: 'idle' as const,
        stopped: 'stopped' as const,
    },
    execution: {
        completed: 'completed' as const,
        cancelled: 'cancelled' as const,
    },
};

export default status;
