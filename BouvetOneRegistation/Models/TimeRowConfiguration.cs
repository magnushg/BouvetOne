using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace BouvetOneRegistation.Models
{
    public class TimeRowConfiguration : EntityTypeConfiguration<TimeRow>
    {
        public TimeRowConfiguration()
        {
            HasKey(x => x.Id);
            HasMany(x => x.Slots);
        }
    }
}