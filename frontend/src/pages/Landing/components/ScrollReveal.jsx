import { motion } from 'framer-motion';

const ScrollReveal = ({
    children,
    className = '',
    direction = 'up',
    delay = 0,
    duration = 0.7,
    distance = 60,
    once = true,
}) => {
    const directionMap = {
        up: { y: distance, x: 0 },
        down: { y: -distance, x: 0 },
        left: { y: 0, x: distance },
        right: { y: 0, x: -distance },
    };

    const offset = directionMap[direction] || directionMap.up;

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, ...offset }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once, margin: '-80px' }}
            transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
        >
            {children}
        </motion.div>
    );
};

export default ScrollReveal;
