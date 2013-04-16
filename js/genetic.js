// Tradeoffs are made between armor, engine speed, weapons
// Things to encode:
//     Light, Medium, Heavy
//         Light ships come in 3s, fly quickly and erratically (in formation?)
//         Medium ships come in 2s, balance between light and heavy
//         Heavy ships come by themselves, have high hull and slow speed
//     Flight behaiviour?
//     Weapon strength and type
//     Armor strength and type

// 4 weapon types, designed to be obviously visually distinguishable.
//     Explosive - impacts cause small explosions. Explosive damage that kills an enemy triggers an explosion
//     Impact - fast moving, nonexplosive. Trigger ship breakup on kill
//     Freeze?
//     Heat/melt?lazors?? (Energy?)
//
// Weapon types:
//     Missiles
//     Lasers
//     Point defense
//     Flechette/slugs
//     Spray stuff (Flamethrowers, etc)
//
// Armor types:
//     Armor
//     Shield

function Chromosome(shipType, weapons, armor, behaviour) {
    this.shipType = shipType;
    this.weapons = weapons;
    this.armor = armor;
    this.behaviour = behaviour;
}

function createShipEntityFromChromosome(chromosome) {
    return createEnemy([0, 0]);
}

var chromosome_count = 10;
var chromosome_pool = [];
var entities_to_entity_sets = {}
var live_chromosomes = {}; // Entity sets to chromosomes?
var dead_chromosomes = {}; // Priority queue. Priorities are fitnesses.
function getNewChromosome() {
    // when we don't have any chromosomes left in the pool
    if(chromosome_pool.length == 0) {
        if(dead_chromosomes.length != 0) {
            // we make a new generation
            //     For 10, take top 3, do crossover between them to get 6.
            //     Then make 4 more randomly
            crossover_count = 3;
            crossover_list = [];
            for(var i = 0; i < crossover_count; i++) {
                crossover_list.push(dead_chromosomes.max());
            }
            for(var i = 0; i < crossover_list.count; i++) {
                for(var j = i; j < crossover_list.count; j++) {
                    chromosome_pool.push(mutate(crossover(crossover_list[i], crossover_list[j])));
                }
            }
        }
        for(var i = chromosome_pool.count; i < chromosome_count; i++) {
            chromosome_pool.push(createRandomChromosome());
        }
    }
    // pick a random chromosome in the chromosome_pool and remove it from pool
    return chromosome_pool.splice(randomIndex(chromosome_pool), 1);
}

function crossover(chromo1, chromo2) {
    return new Chromosome(
        randomInt(1) ? chromo1.shipType : chromo2.shipType,
        randomInt(1) ? chromo1.weapons : chromo2.weapons,
        randomInt(1) ? chromo1.armor : chromo2.weapons,
        randomInt(1) ? chromo1.behaviour : chromo2.behaviour
    );
}

function mutate(chromosome) {
    return new Chromosome(
        mutateShipType(chromosome.shipType),
        mutateWeapons(chromosome.weapons),
        mutateArmor(chromosome.armor),
        mutateBehavious(chromosome.behaviour)
    );
}
