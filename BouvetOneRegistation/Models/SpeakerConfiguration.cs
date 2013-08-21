using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace BouvetOneRegistation.Models
{
    public class SpeakerConfiguration : EntityTypeConfiguration<Speaker>
    {
        public SpeakerConfiguration()
        {
            HasMany(s => s.Sessions);
        }
    }
}