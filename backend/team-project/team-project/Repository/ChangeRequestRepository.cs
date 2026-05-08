using team_project.Data;
using team_project.Domain.Entities;
using team_project.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace team_project.Repository
{
    public class ChangeRequestRepository
    {
        private readonly AppDbContext _db;

        public ChangeRequestRepository(AppDbContext db)
        {
            _db = db;
        }

        // ─── Queries ──────────────────────────────────────────────────────────────

        public async Task<ChangeRequest?> GetByIdAsync(int id)
            => await _db.ChangeRequests
                .Include(cr => cr.WorkTask)
                .FirstOrDefaultAsync(cr => cr.Id == id);

        public async Task<List<ChangeRequest>> GetAllAsync()
            => await _db.ChangeRequests
                .Include(cr => cr.WorkTask)
                .OrderByDescending(cr => cr.RequestedAt)
                .ToListAsync();

        public async Task<List<ChangeRequest>> GetPendingAsync()
            => await _db.ChangeRequests
                .Include(cr => cr.WorkTask)
                .Where(cr => cr.Status == ChangeRequestStatus.Pending)
                .OrderBy(cr => cr.RequestedAt)
                .ToListAsync();

        public async Task<List<ChangeRequest>> GetByTaskIdAsync(int taskId)
            => await _db.ChangeRequests
                .Include(cr => cr.WorkTask)
                .Where(cr => cr.WorkTaskId == taskId)
                .OrderByDescending(cr => cr.RequestedAt)
                .ToListAsync();

        public async Task<List<ChangeRequest>> GetByTaskForMemberAsync(int taskId, string memberId)
            => await _db.ChangeRequests
                .Include(cr => cr.WorkTask)
                .Where(cr => cr.WorkTaskId == taskId && cr.RequestedById == memberId)
                .OrderByDescending(cr => cr.RequestedAt)
                .ToListAsync();

        /// <summary>
        /// Checks whether an approved request of the given type exists for a task.
        /// Used by TaskService to gate restricted field updates.
        /// </summary>
        public async Task<bool> HasApprovedAsync(int taskId, ChangeRequestType type)
            => await _db.ChangeRequests.AnyAsync(cr =>
                cr.WorkTaskId == taskId &&
                cr.Type == type &&
                cr.Status == ChangeRequestStatus.Approved);

        // ─── Write ────────────────────────────────────────────────────────────────

        public async Task<ChangeRequest> AddAsync(ChangeRequest entity)
        {
            _db.ChangeRequests.Add(entity);
            await _db.SaveChangesAsync();
            return entity;
        }

        public async Task SaveAsync()
            => await _db.SaveChangesAsync();
    }
}