using System.Data.Entity;

namespace BouvetOneRegistation.Models
{
    public class RegistrationDbContext : DbContext
    {
        public RegistrationDbContext()  : base(nameOrConnectionString: "BouvetOneRegistration") { }
        
        public DbSet<Speaker> Speakers { get; set; }
        public DbSet<Session> Sessions { get; set; }
        public DbSet<TimeSlot> TimeSlots { get; set; }
    }
}