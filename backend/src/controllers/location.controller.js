import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getBlocks = async (req, res, next) => {
  try {
    const blocks = await prisma.block.findMany({
      include: {
        locations: {
          include: {
            department: true
          },
          where: {
            isActive: true
          }
        },
        _count: {
          select: {
            locations: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formattedBlocks = blocks.map(block => ({
      id: block.id,
      name: block.name,
      description: block.description,
      floors: Math.max(...block.locations.map(loc => loc.floor || 0), 0) || 0,
      areas: block._count.locations,
      locations: block.locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        floor: loc.floor,
        areaType: loc.areaType,
        department: loc.department
      }))
    }));

    res.json({ blocks: formattedBlocks });
  } catch (error) {
    next(error);
  }
};

export const createBlock = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const existingBlock = await prisma.block.findUnique({
      where: { name }
    });

    if (existingBlock) {
      throw new AppError('Block already exists', 400);
    }

    const block = await prisma.block.create({
      data: { name, description }
    });

    res.status(201).json({ message: 'Block created successfully', block });
  } catch (error) {
    next(error);
  }
};

export const getLocations = async (req, res, next) => {
  try {
    const { blockId, departmentId, search } = req.query;

    const where = { isActive: true };
    if (blockId) where.blockId = blockId;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { areaType: { contains: search } }
      ];
    }

    const locations = await prisma.location.findMany({
      where,
      include: {
        block: true,
        department: true
      },
      orderBy: [
        { block: { name: 'asc' } },
        { floor: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({ locations });
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (req, res, next) => {
  try {
    const { blockId, name, floor, areaType, departmentId } = req.body;

    const existingLocation = await prisma.location.findFirst({
      where: {
        blockId,
        name
      }
    });

    if (existingLocation) {
      throw new AppError('Location already exists in this block', 400);
    }

    const location = await prisma.location.create({
      data: {
        blockId,
        name,
        floor: floor ? parseInt(floor) : null,
        areaType,
        departmentId
      },
      include: {
        block: true,
        department: true
      }
    });

    res.status(201).json({ message: 'Location created successfully', location });
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, floor, areaType, departmentId, isActive } = req.body;

    const location = await prisma.location.update({
      where: { id },
      data: {
        name,
        floor: floor !== undefined ? parseInt(floor) : undefined,
        areaType,
        departmentId,
        isActive
      },
      include: {
        block: true,
        department: true
      }
    });

    res.json({ message: 'Location updated successfully', location });
  } catch (error) {
    next(error);
  }
};

export const deleteLocation = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.location.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            requests: true,
            locations: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ departments });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const existingDepartment = await prisma.department.findUnique({
      where: { name }
    });

    if (existingDepartment) {
      throw new AppError('Department already exists', 400);
    }

    const department = await prisma.department.create({
      data: { name, description }
    });

    res.status(201).json({ message: 'Department created successfully', department });
  } catch (error) {
    next(error);
  }
};

