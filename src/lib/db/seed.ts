import type {
    Job,
    Candidate,
    Assessment,
    AssessmentSection,
    Question,
    ValidationRule,
} from '../../types';
import { DatabaseService } from './operations';

// Sample data for generating realistic content
const JOB_TITLES = [
    'Senior Frontend Developer',
    'Backend Engineer',
    'Full Stack Developer',
    'DevOps Engineer',
    'Product Manager',
    'UX/UI Designer',
    'Data Scientist',
    'Mobile Developer',
    'QA Engineer',
    'Technical Lead',
    'Software Architect',
    'Machine Learning Engineer',
    'Site Reliability Engineer',
    'Security Engineer',
    'Database Administrator',
    'Cloud Engineer',
    'React Developer',
    'Node.js Developer',
    'Python Developer',
    'Java Developer',
    'C# Developer',
    'Go Developer',
    'Rust Developer',
    'TypeScript Developer',
    'Angular Developer'
];

const LOCATIONS = [
    'San Francisco, CA',
    'New York, NY',
    'Seattle, WA',
    'Austin, TX',
    'Boston, MA',
    'Chicago, IL',
    'Los Angeles, CA',
    'Denver, CO',
    'Atlanta, GA',
    'Remote',
    'Portland, OR',
    'Miami, FL',
    'Toronto, ON',
    'London, UK',
    'Berlin, Germany'
];

const TECH_TAGS = [
    'React', 'TypeScript', 'Node.js', 'Python', 'Java', 'AWS', 'Docker',
    'Kubernetes', 'GraphQL', 'REST API', 'MongoDB', 'PostgreSQL', 'Redis',
    'Microservices', 'CI/CD', 'Git', 'Agile', 'Scrum', 'TDD', 'Jest',
    'Vue.js', 'Angular', 'Express', 'Django', 'Spring Boot', 'Go',
    'Rust', 'C#', '.NET', 'Azure', 'GCP', 'Terraform', 'Jenkins'
];

const FIRST_NAMES = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
    'Sage', 'River', 'Phoenix', 'Rowan', 'Skyler', 'Cameron', 'Dakota',
    'Emery', 'Finley', 'Hayden', 'Indigo', 'Jamie', 'Kai', 'Lane',
    'Marley', 'Nova', 'Ocean', 'Parker', 'Reese', 'Tatum', 'Vale',
    'Blake', 'Drew', 'Ellis', 'Gray', 'Harper', 'Jesse', 'Kendall', 'Logan',
    'Mason', 'Nico', 'Payton', 'Quinn', 'Remy', 'Shay', 'Teagan', 'Wren',
    'Adrian', 'Bailey', 'Charlie', 'Devon', 'Eden', 'Frankie', 'Grayson', 'Hunter',
    'Iris', 'Jules', 'Kris', 'Lennox', 'Max', 'Noel', 'Oakley', 'Presley'
];

const LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
    'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
    'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
    'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
    'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz',
    'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris'
];

const CANDIDATE_STAGES: Candidate['stage'][] = [
    'applied', 'screen', 'tech', 'offer', 'hired', 'rejected'
];

const JOB_TYPES: Job['type'][] = ['full-time', 'part-time', 'contract'];

// Utility functions
function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomChoices<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

// Job generation
function generateJob(index: number): Job {
    const title = randomChoice(JOB_TITLES);
    const baseSlug = generateSlug(title);
    const slug = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;

    const createdAt = randomDate(
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        new Date()
    );

    return {
        id: crypto.randomUUID(),
        title,
        slug,
        description: `We are looking for a talented ${title} to join our growing team. This role offers exciting opportunities to work with cutting-edge technologies and make a significant impact on our products.`,
        status: Math.random() > 0.2 ? 'active' : 'archived', // 80% active, 20% archived
        tags: randomChoices(TECH_TAGS, randomInt(3, 8)),
        order: index,
        createdAt,
        updatedAt: createdAt,
        requirements: [
            `${randomInt(3, 8)}+ years of experience in software development`,
            `Strong proficiency in ${randomChoices(TECH_TAGS, 3).join(', ')}`,
            'Experience with agile development methodologies',
            'Excellent problem-solving and communication skills',
            'Bachelor\'s degree in Computer Science or related field'
        ],
        location: randomChoice(LOCATIONS),
        type: randomChoice(JOB_TYPES)
    };
}

// Track used names to ensure uniqueness
const usedNames = new Set<string>();

// Candidate generation
function generateCandidate(jobIds: string[], index: number): Candidate {
    let firstName: string;
    let lastName: string;
    let name: string;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loops

    // Keep generating until we get a unique name
    do {
        firstName = randomChoice(FIRST_NAMES);
        lastName = randomChoice(LAST_NAMES);
        name = `${firstName} ${lastName}`;
        attempts++;

        // If we can't find a unique combination, add a number suffix
        if (attempts >= maxAttempts) {
            name = `${firstName} ${lastName} ${index}`;
            break;
        }
    } while (usedNames.has(name));

    // Mark this name as used
    usedNames.add(name);

    // Generate email based on the actual name used (handle cases with number suffixes)
    const nameParts = name.split(' ');
    const emailFirstName = nameParts[0].toLowerCase();
    const emailLastName = nameParts[1].toLowerCase();
    const email = `${emailFirstName}.${emailLastName}.${index}@example.com`;

    const appliedAt = randomDate(
        new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        new Date()
    );

    return {
        id: crypto.randomUUID(),
        name,
        email,
        phone: Math.random() > 0.3 ? `+1-${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}` : undefined,
        resume: Math.random() > 0.4 ? `resume-${firstName.toLowerCase()}-${lastName.toLowerCase()}.pdf` : undefined,
        stage: randomChoice(CANDIDATE_STAGES),
        jobId: randomChoice(jobIds),
        appliedAt,
        updatedAt: appliedAt,
        notes: [],
        assessmentResponses: [],
        timeline: []
    };
}

// Assessment generation
function generateQuestion(index: number): Question {
    const questionTypes: Question['type'][] = [
        'single-choice', 'multi-choice', 'short-text', 'long-text', 'numeric', 'file-upload'
    ];

    const type = randomChoice(questionTypes);
    const questionTemplates = {
        'single-choice': {
            title: 'Which programming paradigm do you prefer?',
            options: ['Object-Oriented', 'Functional', 'Procedural', 'Event-Driven']
        },
        'multi-choice': {
            title: 'Which technologies have you worked with? (Select all that apply)',
            options: ['React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'TypeScript']
        },
        'short-text': {
            title: 'What is your preferred IDE or code editor?'
        },
        'long-text': {
            title: 'Describe a challenging technical problem you solved recently and your approach.'
        },
        'numeric': {
            title: 'How many years of professional development experience do you have?'
        },
        'file-upload': {
            title: 'Please upload your portfolio or code samples.'
        }
    };

    const template = questionTemplates[type];
    const validation: ValidationRule[] = [];

    // Add appropriate validation rules
    if (type === 'short-text' || type === 'long-text') {
        validation.push({
            type: 'required',
            message: 'This field is required'
        });

        if (type === 'short-text') {
            validation.push({
                type: 'max-length',
                value: 100,
                message: 'Maximum 100 characters allowed'
            });
        } else {
            validation.push({
                type: 'min-length',
                value: 50,
                message: 'Minimum 50 characters required'
            });
        }
    }

    if (type === 'numeric') {
        validation.push({
            type: 'numeric-range',
            value: { min: 0, max: 50 },
            message: 'Please enter a value between 0 and 50'
        });
    }

    return {
        id: crypto.randomUUID(),
        type,
        title: template.title,
        description: Math.random() > 0.5 ? 'Please provide detailed information.' : undefined,
        required: Math.random() > 0.3, // 70% required
        options: 'options' in template ? template.options : undefined,
        validation,
        conditionalLogic: [], // We'll keep this simple for seed data
        order: index
    };
}

function generateAssessmentSection(index: number): AssessmentSection {
    const sectionTitles = [
        'Technical Skills',
        'Problem Solving',
        'Experience & Background',
        'Communication & Teamwork',
        'Project Portfolio'
    ];

    const questionCount = randomInt(2, 5);
    const questions: Question[] = [];

    for (let i = 0; i < questionCount; i++) {
        questions.push(generateQuestion(i));
    }

    return {
        id: crypto.randomUUID(),
        title: sectionTitles[index] || `Section ${index + 1}`,
        description: Math.random() > 0.5 ? 'Please answer all questions in this section thoroughly.' : undefined,
        questions,
        order: index
    };
}

function generateAssessment(jobId: string, index: number): Assessment {
    const assessmentTitles = [
        'Technical Assessment',
        'Coding Challenge',
        'System Design Interview',
        'Behavioral Assessment',
        'Portfolio Review'
    ];

    const sectionCount = randomInt(2, 4);
    const sections: AssessmentSection[] = [];

    for (let i = 0; i < sectionCount; i++) {
        sections.push(generateAssessmentSection(i));
    }

    const createdAt = randomDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date()
    );

    return {
        id: crypto.randomUUID(),
        jobId,
        title: assessmentTitles[index] || `Assessment ${index + 1}`,
        description: 'This assessment will help us evaluate your skills and experience for this position.',
        sections,
        createdAt,
        updatedAt: createdAt
    };
}

function generateStandaloneAssessment(_index: number, title: string): Assessment {
    const sectionCount = randomInt(2, 4);
    const sections: AssessmentSection[] = [];

    for (let i = 0; i < sectionCount; i++) {
        sections.push(generateAssessmentSection(i));
    }

    const createdAt = randomDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date()
    );

    return {
        id: crypto.randomUUID(),
        // No jobId for standalone assessments
        title,
        description: 'This is a general assessment that can be used for evaluating candidates across multiple positions.',
        sections,
        createdAt,
        updatedAt: createdAt
    };
}

// Main seed function
export async function seedDatabase(): Promise<void> {
    console.log('Starting database seeding...');

    // Clear existing data and reset name tracking
    await DatabaseService.clearAll();
    usedNames.clear();

    // Generate 25 jobs
    console.log('Generating jobs...');
    const jobs: Job[] = [];
    for (let i = 0; i < 25; i++) {
        jobs.push(generateJob(i));
    }

    // Generate 1000 candidates
    console.log('Generating candidates...');
    const jobIds = jobs.map(job => job.id);
    const candidates: Candidate[] = [];
    for (let i = 0; i < 1000; i++) {
        candidates.push(generateCandidate(jobIds, i));
    }

    // Generate 3+ assessments (1-3 per job, focusing on active jobs)
    console.log('Generating assessments...');
    const assessments: Assessment[] = [];
    const activeJobs = jobs.filter(job => job.status === 'active');

    // Ensure at least 3 assessments
    let assessmentCount = 0;
    for (const job of activeJobs) {
        const numAssessments = randomInt(1, 3);
        for (let i = 0; i < numAssessments; i++) {
            assessments.push(generateAssessment(job.id, assessmentCount));
            assessmentCount++;
        }

        // Stop if we have enough assessments
        if (assessmentCount >= 15) break; // Generate up to 15 assessments
    }

    // Ensure we have at least 3 assessments
    while (assessments.length < 3) {
        const randomJob = randomChoice(activeJobs);
        assessments.push(generateAssessment(randomJob.id, assessments.length));
    }

    // Generate some standalone assessments (not tied to any job)
    console.log('Generating standalone assessments...');
    const standaloneAssessmentTitles = [
        'General Programming Skills Assessment',
        'Communication & Leadership Evaluation',
        'Problem-Solving Challenge',
        'Technical Knowledge Test',
        'Cultural Fit Assessment'
    ];

    for (let i = 0; i < 3; i++) {
        assessments.push(generateStandaloneAssessment(i, standaloneAssessmentTitles[i]));
    }

    // Import all data
    console.log('Importing data to database...');
    await DatabaseService.importData({
        jobs,
        candidates,
        assessments
    });

    const stats = await DatabaseService.getStats();
    console.log('Database seeding completed!');
    console.log('Generated data:', stats);
}

// Function to check if database needs seeding
export async function shouldSeedDatabase(): Promise<boolean> {
    try {
        const stats = await DatabaseService.getStats();

        // Database needs seeding if it's completely empty
        const isEmpty = stats.jobsCount === 0 &&
            stats.candidatesCount === 0 &&
            stats.assessmentsCount === 0;

        // Only reseed if completely empty to prevent duplicates
        // If there's any data, assume it's intentional or from a previous seed

        console.log('Database stats:', stats);
        console.log('Needs seeding:', isEmpty);

        return isEmpty;
    } catch (error) {
        console.error('Error checking database state:', error);
        // If we can't check, assume we need to seed
        return true;
    }
}

// Function to reset and reseed database
export async function resetAndSeedDatabase(): Promise<void> {
    console.log('Resetting and reseeding database...');
    await seedDatabase();
}

// Function to force seed (for development/testing purposes)
export async function forceSeedDatabase(): Promise<void> {
    console.log('Force seeding database (clearing existing data)...');
    await DatabaseService.clearAll();
    await seedDatabase();
}