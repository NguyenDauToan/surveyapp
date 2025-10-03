// utils/roomUtils.ts
export const ensureOwnerInMembers = (room: any, members: any[]) => {
    if (!room.owner) return members;
  
    const ownerExists = members.some((m) => m.id === room.owner.id);
    if (!ownerExists) {
      return [room.owner, ...members];
    }
    return members;
  };
  