using System.Data.Entity.ModelConfiguration;

namespace BouvetOneRegistation.Models
{
    public class TimeSlotConfiguration : EntityTypeConfiguration<TimeSlot>
    {
        public TimeSlotConfiguration()
        {
            HasKey(x => x.Id);
            HasOptional(x => x.Session);
        }
    }
}