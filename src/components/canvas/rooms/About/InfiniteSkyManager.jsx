import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import SkyChunk, { CHUNK_LENGTH } from './SkyChunk';
import IntroMilestone from './IntroMilestone';
import {
    AchievementsMilestone,
    EducationMilestone,
    ExperienceHeadingMilestone,
    ExperienceMilestone,
} from './JourneyMilestones';

// Six 40-unit sky chunks form one complete, repeating journey.
const STORY_CYCLE_LENGTH = 240;
const INITIAL_CHUNKS = [-1, 0, 1, 2];
const INITIAL_STORY_CYCLES = [-1, 0, 1];

const sameMembers = (left, right) => (
    left.length === right.length && left.every((item) => right.includes(item))
);

const InfiniteSkyManager = ({ scrollProgressRef }) => {
    const [activeChunks, setActiveChunks] = useState(INITIAL_CHUNKS);
    const [activeStoryCycles, setActiveStoryCycles] = useState(INITIAL_STORY_CYCLES);
    const worldRef = useRef();

    useFrame(() => {
        if (!worldRef.current) return;

        const scrollProgress = scrollProgressRef?.current || 0;
        worldRef.current.position.z = scrollProgress;

        const currentChunk = Math.floor(scrollProgress / CHUNK_LENGTH);
        const nextChunks = [
            currentChunk - 1,
            currentChunk,
            currentChunk + 1,
            currentChunk + 2,
        ];
        if (!sameMembers(activeChunks, nextChunks)) setActiveChunks(nextChunks);

        const currentStoryCycle = Math.floor(scrollProgress / STORY_CYCLE_LENGTH);
        const nextStoryCycles = [
            currentStoryCycle - 1,
            currentStoryCycle,
            currentStoryCycle + 1,
        ];
        if (!sameMembers(activeStoryCycles, nextStoryCycles)) {
            setActiveStoryCycles(nextStoryCycles);
        }
    });

    return (
        <group ref={worldRef}>
            {activeChunks.map((chunkIndex) => (
                <SkyChunk
                    key={`sky-chunk-${chunkIndex}`}
                    chunkIndex={chunkIndex}
                    seed={42}
                    scrollProgressRef={scrollProgressRef}
                />
            ))}

            {activeStoryCycles.map((cycleIndex) => {
                const cycleStart = cycleIndex * STORY_CYCLE_LENGTH;
                return (
                    <group key={`story-cycle-${cycleIndex}`}>
                        <IntroMilestone
                            z={-(cycleStart + 15)}
                            scrollProgressRef={scrollProgressRef}
                        />
                        <EducationMilestone
                            z={-(cycleStart + 55)}
                            scrollProgressRef={scrollProgressRef}
                        />
                        <ExperienceHeadingMilestone
                            z={-(cycleStart + 78)}
                            scrollProgressRef={scrollProgressRef}
                        />
                        <ExperienceMilestone
                            index={0}
                            z={-(cycleStart + 95)}
                            scrollProgressRef={scrollProgressRef}
                        />
                        <ExperienceMilestone
                            index={1}
                            z={-(cycleStart + 135)}
                            scrollProgressRef={scrollProgressRef}
                        />
                        <ExperienceMilestone
                            index={2}
                            z={-(cycleStart + 175)}
                            scrollProgressRef={scrollProgressRef}
                        />
                        <AchievementsMilestone
                            z={-(cycleStart + 215)}
                            scrollProgressRef={scrollProgressRef}
                        />
                    </group>
                );
            })}
        </group>
    );
};

export default InfiniteSkyManager;
